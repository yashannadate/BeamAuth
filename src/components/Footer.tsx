import Link from "next/link";
import { Cpu, Terminal, Shield, ExternalLink, Activity, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white text-slate-600 font-sans relative overflow-hidden">
      {/* Background grid decor - pointer-events-none */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#15349e05_1px,transparent_1px),linear-gradient(to_bottom,#15349e05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 relative z-10 font-sans">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Column 1: What is BeamAuth? */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#15349e] text-white shadow-sm">
                <Cpu className="h-4 w-4" />
              </div>
              <span className="font-display text-sm font-extrabold tracking-tight text-[#0a0f1d] uppercase">
                What is BeamAuth?
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 font-normal border-l-2 border-[#15349e] pl-3">
              &quot;A frictionless on-chain settlement protocol driven by hardware secure enclaves.&quot;
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-[#15349e]">
              <span className="h-2 w-2 rounded-full bg-[#15349e]" />
              <span>Soroban secp256r1 Engine</span>
            </div>
          </div>

          {/* Column 2: Why we need it */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[#15349e]">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-display text-sm font-extrabold tracking-tight text-[#0a0f1d] uppercase">
                Why we need it
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 font-normal border-l-2 border-slate-200 pl-3">
              &quot;Eliminates seed phrases, trustline friction, and gas fees for mass consumer Web3 adoption.&quot;
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Zero-Gas Relayer Sponsored</span>
            </div>
          </div>

          {/* Column 3: Who it's for */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[#15349e]">
                <Globe className="h-4 w-4" />
              </div>
              <span className="font-display text-sm font-extrabold tracking-tight text-[#0a0f1d] uppercase">
                Who it&apos;s for
              </span>
            </div>
            <ul className="flex flex-col gap-2.5 text-xs font-medium text-slate-600 border-l-2 border-slate-200 pl-3">
              <li className="flex items-center gap-2">
                <span className="text-[#15349e] font-bold">►</span> Global Remittances
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#15349e] font-bold">►</span> B2B Escrow
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#15349e] font-bold">►</span> DAO Bounties
              </li>
            </ul>
          </div>

          {/* Column 4: Links */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[#15349e]">
                <Terminal className="h-4 w-4" />
              </div>
              <span className="font-display text-sm font-extrabold tracking-tight text-[#0a0f1d] uppercase">
                Quick Links
              </span>
            </div>
            <ul className="flex flex-col gap-2.5 text-xs font-semibold">
              <li>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-slate-700 transition-all hover:border-[#15349e] hover:bg-[#15349e]/5 hover:text-[#15349e] shadow-sm"
                >
                  <span>Cipher Dashboard</span>
                  <span className="text-[#15349e]">→</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-slate-700 transition-all hover:border-[#15349e] hover:bg-[#15349e]/5 hover:text-[#15349e] shadow-sm"
                >
                  <span>Documentation</span>
                  <span className="text-[#15349e]">→</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/yashannadate/BeamAuth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-slate-700 transition-all hover:border-[#15349e] hover:bg-[#15349e]/5 hover:text-[#15349e] shadow-sm"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#15349e]" />
                </a>
              </li>
              <li>
                <a
                  href="https://stellar.expert/explorer/testnet/contract/CCCT6ZJ3HN3Y46NNRU2NBJGX77HXGHJXO6FU3TYIGCX3PSRSYRVRGWDE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-slate-700 transition-all hover:border-[#15349e] hover:bg-[#15349e]/5 hover:text-[#15349e] shadow-sm"
                >
                  <span>Testnet Explorer</span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#15349e]" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Status Bar */}
        <div className="mt-16 border-t border-slate-200/80 pt-8 flex items-center justify-center text-center text-xs font-medium text-slate-500 mb-8">
          <div className="font-semibold text-slate-500">
            © {new Date().getFullYear()} BEAMAUTH PROTOCOL · ALL RIGHTS RESERVED
          </div>
        </div>
      </div>

      {/* Blended / Blurry Giant Typography (integrated into footer, not separate) */}
      <div className="w-full bg-white flex items-center justify-center overflow-hidden select-none relative pt-4 pb-2 px-4">
        {/* Soft blurry glow behind the text to blend seamlessly with footer */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#15349e]/20 via-[#15349e]/5 to-transparent blur-3xl pointer-events-none" />
        
        {/* Giant blended text */}
        <span className="font-display font-extrabold text-[16vw] leading-none tracking-tighter bg-gradient-to-b from-[#0a0f1d] via-[#15349e] to-[#15349e]/15 bg-clip-text text-transparent select-none">
          BeamAuth
        </span>
      </div>
    </footer>
  );
}
