/**
 * app/api/webauthn/challenge/route.ts
 *
 * Generates a fresh WebAuthn authentication challenge for each claim attempt.
 * The challenge is a cryptographically random 32-byte buffer used to prevent
 * replay attacks in the WebAuthn ceremony.
 */

import { NextResponse } from "next/server";

export async function GET() {
  // Generate a cryptographically random 32-byte challenge
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  const challengeB64 = Buffer.from(challenge).toString("base64url");

  const rpId = process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID ?? "localhost";

  // Generate a random 16-byte user ID for registration
  const userId = new Uint8Array(16);
  crypto.getRandomValues(userId);
  const userIdB64 = Buffer.from(userId).toString("base64url");

  // Return the registration options in the format expected by startRegistration()
  return NextResponse.json({
    challenge: challengeB64,
    rp: {
      name: "BeamAuth",
      id: rpId,
    },
    user: {
      id:          userIdB64,
      name:        "claimant@beamauth.xyz",
      displayName: "BeamAuth Claimant",
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },   // ES256 (P-256 / secp256r1)
      { type: "public-key", alg: -257 }, // RS256
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
