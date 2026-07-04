/**
 * app/api/pod/challenge/route.ts
 *
 * Generates a WebAuthn challenge for the Proof of Device (PoD) identity registry.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userAddress = searchParams.get("userAddress") ?? "unknown";

  // Generate a random 32-byte challenge
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  const challengeB64 = Buffer.from(challenge).toString("base64url");

  const rpId = process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID ?? "localhost";

  // Generate a random 16-byte user ID
  const userId = new Uint8Array(16);
  crypto.getRandomValues(userId);
  const userIdB64 = Buffer.from(userId).toString("base64url");

  return NextResponse.json({
    challenge: challengeB64,
    rp: {
      name: "BeamAuth PoD Registry",
      id: rpId,
    },
    user: {
      id:          userIdB64,
      name:        `pod-${userAddress}`,
      displayName: `PoD Anchor - ${userAddress.slice(0, 8)}...`,
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 }, // ES256 (secp256r1)
    ],
    timeout: 60_000,
    attestation: "none",
    authenticatorSelection: {
      residentKey: "required",
      requireResidentKey: true,
      userVerification: "required",
    },
  });
}
