import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeamAuth — Stellar Onboarding Protocol",
  description:
    "Zero-friction, seedless smart wallet onboarding on Stellar. Send USDC with a link. Claim with Face ID. No seed phrases, no downloads.",
  keywords: [
    "Stellar", "Soroban", "Web3", "Passkeys", "WebAuthn", "Smart Wallet",
    "USDC", "DeFi", "BeamAuth", "crypto onboarding",
  ],
  openGraph: {
    title: "BeamAuth — Stellar Onboarding Protocol",
    description: "Send crypto with a link. Claim with Face ID.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BeamAuth — Stellar Onboarding Protocol",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-beam-black text-beam-white antialiased">
        {/* Subtle noise texture overlay for depth */}
        <div className="noise-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
