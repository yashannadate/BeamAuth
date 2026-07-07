import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";

export const metadata: Metadata = {
  title: "BeamAuth // Biometric Cipher Settlement",
  description: "Frictionless on-chain settlement protocol driven by hardware secure enclaves on Stellar Soroban.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f4f6fb] text-[#0a0f1d] antialiased font-sans selection:bg-[#15349e]/20 selection:text-[#0a0f1d] relative overflow-x-hidden">
        {/* Soft Light Background - pointer-events-none */}
        <div className="fixed inset-0 z-0 bg-[#f4f6fb] pointer-events-none" />
        
        {/* Subtle atmospheric glow - pointer-events-none */}
        <div className="fixed -top-40 left-1/3 h-[600px] w-[600px] rounded-full bg-[#15349e]/[0.03] blur-[150px] pointer-events-none" />
        <div className="fixed -bottom-40 right-10 h-[500px] w-[500px] rounded-full bg-[#15349e]/[0.03] blur-[150px] pointer-events-none" />

        {/* Application Content */}
        <div className="relative z-10 flex min-h-screen flex-col font-sans">
          <WalletProvider>
            {children}
          </WalletProvider>
        </div>
      </body>
    </html>
  );
}
