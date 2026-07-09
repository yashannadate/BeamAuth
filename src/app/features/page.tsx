"use client";

import {
  Cpu,
  Fingerprint,
  Zap,
  ShieldCheck,
  ArrowRight,
  Layers,
  Lock,
  Key,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ButtonLink } from "@/components/ui/button";
import { PageShell, PageContainer, GlassCard } from "@/components/ui/layout";

export default function FeaturesPage() {
  return (
    <PageShell>
      <Navbar />

      <main className="flex-1 font-sans">
        
        {/* Header Section */}
        <section className="pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 text-center font-sans">
          <PageContainer className="flex flex-col items-center max-w-4xl mx-auto gap-6 z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 font-sans text-xs font-semibold text-slate-600 uppercase tracking-wide shadow-sm">
              <Cpu className="h-3.5 w-3.5 text-[#15349e]" />
              <span>Identity &amp; Settlement Terminal</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#0a0f1d] leading-tight">
              Protocol Architecture <span className="text-[#15349e]">· Terminal Specs</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
              Built on next-generation Soroban host functions, hardware Secure Enclaves, and institutional cryptographic standards.
            </p>
          </PageContainer>
        </section>

        {/* ══════════════════════════════════════════════════
            FEATURE GRID - INVOKO LIGHT TERMINAL AESTHETIC
        ═════════════════════════════════════════════════ */}
        <section className="py-16 border-t border-slate-200/80 bg-[#f4f6fb] relative font-sans">
          <PageContainer>
            
            {/* 2x2 Terminal Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto font-sans">
              
              {/* Card 1: Biometric Security */}
              <div className="flex flex-col gap-6 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 hover:border-[#15349e]/40 hover:shadow-[0_15px_35px_rgba(21,52,158,0.08)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#15349e] uppercase tracking-wider px-3 py-1 rounded-full border border-[#15349e]/20 bg-[#15349e]/5 font-mono">
                    MOD_01 // AUTH
                  </span>
                  <Fingerprint className="h-6 w-6 text-[#15349e] group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className="font-display text-xl font-bold text-[#0a0f1d] tracking-tight">
                    Biometric Security
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    Claim funds instantly using your device&apos;s native Face ID or Touch ID without ever managing seed phrases.
                  </p>
                </div>
                <div className="mt-auto pt-4 font-mono text-[10px] text-emerald-400 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800 tracking-wider leading-relaxed overflow-x-auto shadow-inner">
                  &gt; ENCLAVE_ATTEST: NIST P-256 (secp256r1) keypair verified. WebAuthn assertion valid.
                </div>
              </div>

              {/* Card 2: Zero-Gas Settlement */}
              <div className="flex flex-col gap-6 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 hover:border-[#15349e]/40 hover:shadow-[0_15px_35px_rgba(21,52,158,0.08)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#15349e] uppercase tracking-wider px-3 py-1 rounded-full border border-[#15349e]/20 bg-[#15349e]/5 font-mono">
                    MOD_02 // RELAY
                  </span>
                  <Zap className="h-6 w-6 text-[#15349e] group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className="font-display text-xl font-bold text-[#0a0f1d] tracking-tight">
                    Zero-Gas Settlement
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    Our automated relayer pays all network gas fees so recipients can claim funds with zero crypto balance.
                  </p>
                </div>
                <div className="mt-auto pt-4 font-mono text-[10px] text-emerald-400 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800 tracking-wider leading-relaxed overflow-x-auto shadow-inner">
                  &gt; RELAYER_SPONSOR: Fee-bumped tx constructed. Gas cost: 0.00000 XLM (100% sponsored).
                </div>
              </div>

              {/* Card 3: Sybil Resistance */}
              <div className="flex flex-col gap-6 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 hover:border-[#15349e]/40 hover:shadow-[0_15px_35px_rgba(21,52,158,0.08)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#15349e] uppercase tracking-wider px-3 py-1 rounded-full border border-[#15349e]/20 bg-[#15349e]/5 font-mono">
                    MOD_03 // SYBIL
                  </span>
                  <ShieldCheck className="h-6 w-6 text-[#15349e] group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className="font-display text-xl font-bold text-[#0a0f1d] tracking-tight">
                    Sybil Resistance
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    Hardware-level attestation binds wallet accounts to physical silicon, preventing automated bot attacks.
                  </p>
                </div>
                <div className="mt-auto pt-4 font-mono text-[10px] text-emerald-400 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800 tracking-wider leading-relaxed overflow-x-auto shadow-inner">
                  &gt; SYBIL_PROOF: Hardware Secure Enclave registry confirmed. Score: 100% MAXIMUM.
                </div>
              </div>

              {/* Card 4: Soroban Host Engine */}
              <div className="flex flex-col gap-6 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 hover:border-[#15349e]/40 hover:shadow-[0_15px_35px_rgba(21,52,158,0.08)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#15349e] uppercase tracking-wider px-3 py-1 rounded-full border border-[#15349e]/20 bg-[#15349e]/5 font-mono">
                    MOD_04 // ENGINE
                  </span>
                  <Cpu className="h-6 w-6 text-[#15349e] group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className="font-display text-xl font-bold text-[#0a0f1d] tracking-tight">
                    Soroban Host Engine
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    Powered by native cryptographic host functions executing lightning-fast smart contract escrow verification.
                  </p>
                </div>
                <div className="mt-auto pt-4 font-mono text-[10px] text-emerald-400 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800 tracking-wider leading-relaxed overflow-x-auto shadow-inner">
                  &gt; HOST_FUNC: env.crypto().secp256r1_verify() executed on Soroban testnet in &lt; 12ms.
                </div>
              </div>

            </div>

            {/* Additional Deep Technical Specs Box */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-200/80 pt-16">
              <GlassCard className="p-6 bg-white border-slate-200/80">
                <Lock className="h-6 w-6 text-[#15349e] mb-4" />
                <h4 className="font-display text-lg font-bold text-[#0a0f1d] mb-2">Non-Custodial Escrow</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Smart contracts hold assets directly on-chain with automated time-locks. No intermediaries or custodial risks.
                </p>
              </GlassCard>
              <GlassCard className="p-6 bg-white border-slate-200/80">
                <Key className="h-6 w-6 text-[#15349e] mb-4" />
                <h4 className="font-display text-lg font-bold text-[#0a0f1d] mb-2">WebAuthn Primitives</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Leverages standard browser and OS credential APIs, turning everyday smartphones into hardware security modules.
                </p>
              </GlassCard>
              <GlassCard className="p-6 bg-white border-slate-200/80">
                <Layers className="h-6 w-6 text-[#15349e] mb-4" />
                <h4 className="font-display text-lg font-bold text-[#0a0f1d] mb-2">Stellar Consensus</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Achieves sub-second finality with negligible energy expenditure and predictable fee structures.
                </p>
              </GlassCard>
            </div>

            {/* Bottom Callout Box */}
            <div className="mt-16 rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 font-sans shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
              <div className="flex flex-col gap-2">
                <span className="font-sans text-xs font-bold text-[#15349e] uppercase tracking-wide">
                  READY TO INITIALIZE YOUR CIPHER TERMINAL?
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0a0f1d]">
                  Experience seamless, gasless biometric settlement.
                </h3>
              </div>
              <ButtonLink
                href="/dashboard"
                variant="primary"
                size="lg"
                className="shrink-0 font-sans text-sm font-bold uppercase tracking-wide shadow-[0_4px_20px_rgba(21,52,158,0.25)] rounded-full"
              >
                Access Cipher Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </ButtonLink>
            </div>

          </PageContainer>
        </section>

      </main>

      <Footer />
    </PageShell>
  );
}
