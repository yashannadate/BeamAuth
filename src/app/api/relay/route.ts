/**
 * app/api/relay/route.ts
 *
 * BeamAuth Fee-Bump Relayer — Next.js App Router POST handler.
 *
 * This endpoint is the backend engine of BeamAuth. It receives the
 * WebAuthn assertion from the mobile client, parses the biometric signature,
 * builds a composite Soroban transaction, wraps it in a Fee-Bump (so the
 * user pays zero gas), and submits it to Stellar Testnet.
 *
 * POST /api/relay
 * Body: { secret: string, webauthnResponse: AuthenticationResponseJSON }
 * Response: { success: true, txHash: string, walletAddress: string }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  derToRawSignature,
  extractPublicKeyFromAuthData,
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
  try {
    // ── 1. Parse request body ───────────────────────────────────────────────
    const body = await req.json() as RelayRequestBody;
    const { secret, webauthnResponse } = body;

    if (!secret || !webauthnResponse) {
      return errorResponse(400, "Missing required fields: secret, webauthnResponse");
    }

    // ── 2. Decode WebAuthn assertion components ─────────────────────────────
    const { response: assertionResponse } = webauthnResponse;

    const authenticatorDataBytes = base64UrlToBytes(assertionResponse.authenticatorData);
    const clientDataJSON         = atob(
      assertionResponse.clientDataJSON.replace(/-/g, "+").replace(/_/g, "/")
    );

    // ── 3. Extract secp256r1 public key from authenticatorData ──────────────
    // On first registration the authenticatorData contains the COSE key.
    // On subsequent assertions we use the stored public key.
    // For this MVP relayer, the public key is included in the assertion data.
    let publicKeyHex: string;

    if (assertionResponse.attestationObject) {
      // Registration ceremony — extract fresh public key
      const attObj = base64UrlToBytes(assertionResponse.attestationObject);
      publicKeyHex = bytesToHex(extractPublicKeyFromAuthData(attObj));
    } else if (body.publicKeyHex) {
      // Subsequent assertion — client sends the stored public key
      publicKeyHex = body.publicKeyHex;
    } else {
      return errorResponse(400, "publicKeyHex required for authentication assertions");
    }

    // ── 4. Convert DER signature → raw 64-byte r||s ─────────────────────────
    const rawSignature   = derToRawSignature(assertionResponse.signature);
    const signatureHex   = bytesToHex(rawSignature);

    // ── 5. Verify the WebAuthn signature message format ──────────────────────
    // (Soroban verifies the actual signature on-chain; we just format it here)
    const messageHash = await computeSignatureMessage(
      authenticatorDataBytes,
      clientDataJSON,
    );
    console.log("[relay] Message hash:", bytesToHex(messageHash));
    console.log("[relay] Public key:  ", publicKeyHex.slice(0, 16) + "...");
    console.log("[relay] Signature:   ", signatureHex.slice(0, 16) + "...");

    // ── 6. Convert secret string → hex ──────────────────────────────────────
    // The secret arrives as a plain string from the URL parameter.
    // We encode it to bytes then hex for the Soroban contract.
    const secretHex = bytesToHex(new TextEncoder().encode(secret));

    // ── 7. Build and submit the Fee-Bump transaction ─────────────────────────
    console.log("[relay] Building Fee-Bump transaction on Stellar Testnet...");
    const { txHash, walletAddress } = await buildAndSubmitClaimTx({
      secretHex,
      publicKeyHex,
      signatureHex,
    });

    console.log("[relay] ✅ Transaction confirmed:", txHash);
    console.log("[relay] 📦 Wallet deployed at:  ", walletAddress);

    // ── 8. Return success ────────────────────────────────────────────────────
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
