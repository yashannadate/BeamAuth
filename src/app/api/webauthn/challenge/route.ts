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

  // Convert to Base64URL (the format @simplewebauthn/browser expects)
  const challengeB64 = Buffer.from(challenge).toString("base64url");

  // Return the challenge options in the format expected by startAuthentication()
  return NextResponse.json({
    challenge: challengeB64,
    rpId:      process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID ?? "localhost",
    timeout:   60_000,
    userVerification: "required",
    allowCredentials: [],
  });
}
