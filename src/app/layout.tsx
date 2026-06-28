import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";

export const metadata: Metadata = {
  title: "BeamAuth — Institutional Stellar Authentication",
  description:
    "The institutional-grade authentication layer for seamless, gasless, and passwordless transactions on the Stellar network.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="app-bg" aria-hidden="true" />
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
