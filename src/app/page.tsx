"use client";

import {
  Cpu,
  Fingerprint,
  Zap,
  ArrowRight,
  Timer,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExecutionTimeline from "@/components/ExecutionTimeline";
import { ButtonLink } from "@/components/ui/button";
import { PageShell, PageContainer } from "@/components/ui/layout";

export default function HomePage() {
  return (
    <PageShell>
      <Navbar />

      <main className="flex-1 font-sans">
        {/* ══════════════════════════════════════════════════
            HERO SECTION - INVOKO LIGHT AESTHETIC (#F4F6FB, DEEP NAVY, ELECTRIC COBALT BLUE)
        ═════════════════════════════════════════════════ */}
        <section className="relative pt-16 pb-20 sm:pt-20 sm:pb-28 md:pt-32 md:pb-36 px-4 sm:px-6 overflow-hidden text-center font-sans">
          <PageContainer className="flex flex-col items-center max-w-4xl mx-auto gap-6 z-10">
            
            {/* Headline with Invoko-style glowing orb badge replacing 'o' in Crypto */}
            <h1 className="text-4xl xs:text-5xl md:text-7xl font-extrabold tracking-tight text-[#0a0f1d] leading-[1.1] px-2">
              Send Crypt
              <span className="inline-flex items-center justify-center w-10 h-10 xs:w-12 xs:h-12 md:w-16 md:h-16 rounded-full bg-[#15349e] text-white shadow-[0_0_35px_rgba(21,52,158,0.45)] mx-1 xs:mx-1.5 -my-1 xs:-my-2 align-middle hover:scale-105 transition-transform cursor-pointer">
                <Fingerprint className="w-5 h-5 xs:w-6 xs:h-6 md:w-8 md:h-8" />
              </span>
              . Claim With a Glance.
            </h1>

            {/* Sub-headline */}
            <p className="text-slate-500 font-normal text-base md:text-lg max-w-xl mx-auto leading-relaxed mt-2">
              Lock funds on-chain. Send a link. The recipient authenticates with Face ID to settle the transaction—no app required.
            </p>

            {/* CTA Area */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full sm:w-auto font-sans">
              <ButtonLink
                href="/dashboard"
                variant="primary"
                size="lg"
                className="font-sans text-sm font-bold shadow-[0_4px_20px_rgba(21,52,158,0.25)] rounded-full px-8 py-3.5"
              >
                Access Cipher Dashboard
              </ButtonLink>
            </div>

            {/* Scroll Indicator */}
            <div className="mt-12 flex flex-col items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono">
              <span>SCROLL TO SEE BEAMAUTH IN CONTEXT</span>
              <ChevronDown className="h-4 w-4 animate-bounce text-[#15349e]" />
            </div>

            {/* Protocol Metrics Ribbon (Clean White Card) */}
            <div className="grid grid-cols-2 md:grid-cols-4 md:divide-x md:divide-slate-200/80 bg-white border border-slate-200/80 rounded-2xl px-4 py-6 sm:p-8 w-full max-w-4xl mt-10 gap-y-6 md:gap-y-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              
              {/* Metric 1 */}
              <div className="flex flex-col items-center justify-center text-center px-2 sm:px-4">
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 shrink-0" />
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#0a0f1d]">$0.00</span>
                </div>
                <span className="text-xs uppercase tracking-widest font-mono text-slate-500 font-bold mt-1">
                  Gas Fee (Relayed)
                </span>
              </div>

              {/* Metric 2 */}
              <div className="flex flex-col items-center justify-center text-center px-4">
                <div className="flex items-center gap-2.5">
                  <Fingerprint className="h-6 w-6 text-[#15349e] shrink-0" />
                  <span className="text-3xl font-extrabold text-[#0a0f1d]">secp256r1</span>
                </div>
                <span className="text-xs uppercase tracking-widest font-mono text-slate-500 font-bold mt-1">
                  Native Curve
                </span>
              </div>

              {/* Metric 3 */}
              <div className="flex flex-col items-center justify-center text-center px-4">
                <div className="flex items-center gap-2.5">
                  <Timer className="h-6 w-6 text-indigo-600 shrink-0" />
                  <span className="text-3xl font-extrabold text-[#0a0f1d]">&lt; 2s</span>
                </div>
                <span className="text-xs uppercase tracking-widest font-mono text-slate-500 font-bold mt-1">
                  Atomic Settle
                </span>
              </div>

              {/* Metric 4 */}
              <div className="flex flex-col items-center justify-center text-center px-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                  <span className="text-3xl font-extrabold text-[#0a0f1d]">100%</span>
                </div>
                <span className="text-xs uppercase tracking-widest font-mono text-slate-500 font-bold mt-1">
                  Sybil Proof
                </span>
              </div>

            </div>

          </PageContainer>
        </section>

        {/* ══════════════════════════════════════════════════
            HOW IT WORKS (Execution Pipeline Timeline)
        ═════════════════════════════════════════════════ */}
        <section className="py-24 border-t border-slate-200/80 bg-[#f4f6fb] relative font-sans">
          <PageContainer>
            <ExecutionTimeline />
          </PageContainer>
        </section>

        {/* ══════════════════════════════════════════════════
            EXPLORE TERMINAL SPECS (Teaser to Features Page)
        ═════════════════════════════════════════════════ */}
        <section className="py-24 border-t border-slate-200/80 bg-[#f4f6fb] relative font-sans">
          <PageContainer>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 font-sans shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#15349e] uppercase tracking-wider">
                  <Cpu className="h-4 w-4" />
                  <span>DEEP TECHNICAL SPECS</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0a0f1d] tracking-tight">
                  Explore the Biometric Cipher Terminal Architecture.
                </h2>
                <p className="text-slate-500 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
                  Dive into our 100% sybil-resistant Proof of Device registry, zero-gas relayer layer, and native Soroban secp256r1 host engine.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full md:w-auto">
                <ButtonLink
                  href="/features"
                  variant="outline"
                  size="lg"
                  className="font-sans text-sm font-bold uppercase tracking-wide border-slate-200 hover:border-[#15349e] rounded-full"
                >
                  View Features &amp; Specs
                  <ArrowRight className="h-4 w-4 ml-2" />
                </ButtonLink>
                <ButtonLink
                  href="/dashboard"
                  variant="primary"
                  size="lg"
                  className="font-sans text-sm font-bold uppercase tracking-wide shadow-[0_4px_20px_rgba(21,52,158,0.25)] rounded-full"
                >
                  Launch Terminal
                </ButtonLink>
              </div>
            </div>
          </PageContainer>
        </section>
      </main>

      <Footer />
    </PageShell>
  );
}
