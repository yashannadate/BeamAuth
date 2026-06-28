/**
 * app/api/relay/route.ts
 *
 * BeamAuth Fee-Bump Relayer — Next.js App Router POST handler.
 *
 * This endpoint is the backend engine of BeamAuth. It receives the
 * WebAuthn assertion from the mobile client, parses the biometric signature,
 * builds a composite Soroban transaction (deploy passkey wallet + claim native XLM),
 * wraps it in a Fee-Bump so the user pays zero gas, and submits it to Stellar Testnet.
 *
 * POST /api/relay
 * Body: { secret: string, webauthnResponse: AuthenticationResponseJSON }
 * Response: { success: true, txHash: string, walletAddress: string }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  derToRawSignature,
  extractPublicKeyFromAuthData,
  extractAuthDataFromAttestationObject,
  computeSignatureMessage,
  base64UrlToBytes,
  bytesToHex,
} from "@/lib/webauthn";
import { buildAndSubmitClaimTx } from "@/lib/stellar";

// ── CORS headers for mobile browser requests ──────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ─────────────────────────────────────────────────────────────────────────────
//  CORS pre-flight
// ─────────────────────────────────────────────────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/relay
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Parse request body ─────────────────────────────────────────────────
  let body: RelayRequestBody;
  try {
    body = await req.json() as RelayRequestBody;
  } catch {
    return errorResponse(400, "Invalid JSON in request body");
  }

  try {
    const { secret, webauthnResponse } = body;

    if (!secret || !webauthnResponse) {
      return errorResponse(400, "Missing required fields: secret, webauthnResponse");
    }

    if (!webauthnResponse.response || !webauthnResponse.response.clientDataJSON) {
      return errorResponse(400, "Malformed webauthnResponse: missing response.clientDataJSON");
    }

    // ── 2. Decode WebAuthn components ───────────────────────────────────────
    const { response: assertionResponse } = body.webauthnResponse;
    const clientDataJSON = atob(
      assertionResponse.clientDataJSON.replace(/-/g, "+").replace(/_/g, "/")
    );

    let publicKeyHex: string;
    let signatureHex = "";

    // ── 3. Extract public key and handle signature based on ceremony type ──
    if (assertionResponse.attestationObject) {
      // ── Registration (first-time claim) ──
      const attObj = base64UrlToBytes(assertionResponse.attestationObject);
      
      // Extract the raw authData byte array from the CBOR attestationObject
      const authData = extractAuthDataFromAttestationObject(attObj);
      
      // Extract public key coordinates from the authData COSE map
      publicKeyHex = bytesToHex(extractPublicKeyFromAuthData(authData));
      
      console.log("[relay] Registration detected. Extracted Public Key:", publicKeyHex.slice(0, 16) + "...");
    } else {
      // ── Assertion (subsequent transacts) ──
      if (!assertionResponse.authenticatorData || !assertionResponse.signature) {
        return errorResponse(400, "authenticatorData and signature are required for assertions");
      }
      if (!body.publicKeyHex) {
        return errorResponse(400, "publicKeyHex required for assertions");
      }

      publicKeyHex = body.publicKeyHex;

      const authenticatorDataBytes = base64UrlToBytes(assertionResponse.authenticatorData);
      const rawSignature = derToRawSignature(assertionResponse.signature);
      signatureHex = bytesToHex(rawSignature);

      // Verify the WebAuthn signature message format
      const messageHash = await computeSignatureMessage(
        authenticatorDataBytes,
        clientDataJSON,
      );
      console.log("[relay] Assertion detected. Message hash:", bytesToHex(messageHash));
    }

    console.log("[relay] Public key:  ", publicKeyHex.slice(0, 16) + "...");
    console.log("[relay] Signature:   ", signatureHex ? signatureHex.slice(0, 16) + "..." : "none");

    // ── 4. Convert secret string → hex ──────────────────────────────────────
    const secretHex = bytesToHex(new TextEncoder().encode(body.secret));

    // ── 5. Build and submit the Fee-Bump transaction ─────────────────────────
    console.log("[relay] Building Fee-Bump transaction on Stellar Testnet...");
    const { txHash, walletAddress } = await buildAndSubmitClaimTx({
      secretHex,
      publicKeyHex,
      signatureHex,
    });

    console.log("[relay] ✅ Transaction confirmed:", txHash);
    console.log("[relay] 📦 Wallet deployed at:  ", walletAddress);

    // ── 6. Return success ────────────────────────────────────────────────────
    return NextResponse.json(
      { success: true, txHash, walletAddress },
      { status: 200, headers: CORS_HEADERS }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown relay error";
    console.error("[relay] ❌ Error:", message);

    // Classify errors for cleaner frontend UX
    if (message.includes("Simulation failed")) {
      return errorResponse(422, `Contract simulation failed: ${message}`);
    }
    if (message.includes("RELAYER_SECRET_KEY")) {
      return errorResponse(500, "Relayer not configured — check server environment variables");
    }
    if (message.includes("getAccount")) {
      return errorResponse(503, "Stellar network unavailable — please try again");
    }

    return errorResponse(500, message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

interface RelayRequestBody {
  /** The raw secret string from the claim URL ?secret= parameter */
  secret: string;
  /** WebAuthn AuthenticationResponseJSON from @simplewebauthn/browser */
  webauthnResponse: {
    id:       string;
    rawId:    string;
    type:     string;
    response: {
      authenticatorData:  string;
      clientDataJSON:     string;
      signature:          string;
      attestationObject?: string;
    };
  };
  /** Pre-stored secp256r1 public key (hex) for returning users */
  publicKeyHex?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Error helper
// ─────────────────────────────────────────────────────────────────────────────

function errorResponse(status: number, error: string) {
  return NextResponse.json(
    { success: false, error },
    { status, headers: CORS_HEADERS }
  );
}
