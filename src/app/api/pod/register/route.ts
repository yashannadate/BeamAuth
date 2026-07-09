/**
 * app/api/pod/register/route.ts
 *
 * Facilitates the PoD registration transaction pipeline.
 * Action "build": parses WebAuthn payloads, extracts cryptographic params, and builds/simulates the registry transaction.
 * Action "submit": signs the outer fee-bump and commits it to the ledger.
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  TransactionBuilder, 
  Contract, 
  Address,
  nativeToScVal,
  Transaction
} from "@stellar/stellar-sdk";
import crypto from "crypto";
import { 
  getRpcServer, 
  getRelayerKeypair, 
  NETWORK_PASSPHRASE, 
  BASE_FEE, 
  FEE_BUMP_BASE_FEE 
} from "@/lib/stellar";
import { 
  base64UrlToBytes, 
  extractAuthDataFromAttestationObject, 
  extractPublicKeyFromAuthData, 
  derToRawSignature 
} from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const server = getRpcServer();

    if (action === "build") {
      const { userAddress, registrationResponse, assertionResponse } = body;

      if (!userAddress || !registrationResponse || !assertionResponse) {
        return NextResponse.json({ error: "Missing required parameters for build" }, { status: 400 });
      }

      // 1. Parse public key from registration payload
      const attObj = base64UrlToBytes(registrationResponse.response.attestationObject);
      const authData = extractAuthDataFromAttestationObject(attObj);
      const rawPubKey = extractPublicKeyFromAuthData(authData);

      // Prepend 0x04 for 65-byte uncompressed SEC-1 format
      const publicKeyBytes = new Uint8Array(65);
      publicKeyBytes[0] = 0x04;
      publicKeyBytes.set(rawPubKey, 1);
      const publicKeyHex = Buffer.from(publicKeyBytes).toString("hex");

      // 2. Parse signature from assertion payload (ASN.1 DER -> raw 64-byte r||s)
      const rawSig = derToRawSignature(assertionResponse.response.signature);
      const signatureHex = Buffer.from(rawSig).toString("hex");

      // 3. Compute the raw message that was signed by the device: authenticatorData || SHA-256(clientDataJSON)
      const assertionAuthData = base64UrlToBytes(assertionResponse.response.authenticatorData);
      const clientDataJSONBytes = base64UrlToBytes(assertionResponse.response.clientDataJSON);
      const clientDataHash = crypto.createHash("sha256").update(clientDataJSONBytes).digest();
      const messageBytes = Buffer.concat([Buffer.from(assertionAuthData), clientDataHash]);
      const messageHex = messageBytes.toString("hex");

      // 4. Build the register_device contract call
      const podContractId = (process.env.NEXT_PUBLIC_POD_REGISTRY_CONTRACT_ID || "CCCT6ZJ3HN3Y46NNRU2NBJGX77HXGHJXO6FU3TYIGCX3PSRSYRVRGWDE").trim();
      if (!podContractId) {
        return NextResponse.json({ error: "PoD Registry Contract ID not configured" }, { status: 500 });
      }

      const podContract = new Contract(podContractId);
      const userScVal = new Address(userAddress).toScVal();
      const pubKeyScVal = nativeToScVal(Buffer.from(publicKeyHex, "hex"), { type: "bytes" });
      const messageScVal = nativeToScVal(Buffer.from(messageHex, "hex"), { type: "bytes" });
      const sigScVal = nativeToScVal(Buffer.from(signatureHex, "hex"), { type: "bytes" });

      const registerOp = podContract.call(
        "register_device",
        userScVal,
        pubKeyScVal,
        messageScVal,
        sigScVal
      );

      // 5. Fetch user account for sequence number and build transaction
      const userAccount = await server.getAccount(userAddress);
      const tx = new TransactionBuilder(userAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(registerOp)
        .setTimeout(120)
        .build();

      const preparedTx = await server.prepareTransaction(tx);

      return NextResponse.json({
        unsignedXdr: preparedTx.toXDR(),
        publicKeyHex,
        messageHex,
        signatureHex
      });

    } else if (action === "submit") {
      const { signedXdr } = body;
      if (!signedXdr) {
        return NextResponse.json({ error: "Missing signed XDR" }, { status: 400 });
      }

      const relayer = getRelayerKeypair();
      const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE) as Transaction;

      // Wrap in a fee-bump transaction sponsored by the relayer
      const feeBump = TransactionBuilder.buildFeeBumpTransaction(
        relayer,
        FEE_BUMP_BASE_FEE,
        signedTx,
        NETWORK_PASSPHRASE
      );
      feeBump.sign(relayer);

      const response = await server.sendTransaction(feeBump);
      if (response.status === "ERROR") {
        return NextResponse.json({ 
          error: "Transaction submission rejected", 
          errorResult: response.errorResult 
        }, { status: 500 });
      }

      return NextResponse.json({ txHash: response.hash });

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error: unknown) {
    console.error("[PoD Registry API] Error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
