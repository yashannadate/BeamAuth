"use client";

import { useState, useEffect, useRef } from "react";
import {
  Lock,
  Share2,
  Fingerprint,
  CheckCircle,
  ArrowRight,
  Terminal,
  Sparkles,
  Send,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/layout";
import { cn } from "@/lib/utils";

export default function ExecutionTimeline() {
  const [terminalLogs] = useState<string[]>([
    "[SYSTEM] Secure Enclave session initialized...",
    "[VAULT] Digital envelope locked on-chain (Gas fee: $0.00)...",
    "[ATTEST] Waiting for recipient Face ID / Touch ID authentication...",
    "[CRYPTO] Verifying hardware biometric attestation...",
    "[SETTLE] Instant zero-fee transfer confirmed! Money received.",
  ]);

  const logBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  const steps = [
    {
      step: "01",
      headline: "Seal the Vault",
      desc: "Lock your funds in a secure digital envelope. No wallet required for the recipient.",
      state: "Vault Sealed",
      icon: Lock,
      badgeColor: "text-[#0052FF] bg-[#0052FF]/10 border-[#0052FF]/30",
    },
    {
      step: "02",
      headline: "Share the Link",
      desc: "Send the secure link via any messenger. It’s ready whenever they are.",
      state: "Link Sent",
      icon: Share2,
      badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    },
    {
      step: "03",
      headline: "One-Tap Claim",
      desc: "The recipient scans their face or fingerprint to claim the funds instantly. No fees, no setup.",
      state: "Money Received",
      icon: Fingerprint,
      badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    },
  ];

  return (
    <div className="flex flex-col gap-16 font-sans w-full max-w-4xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col items-center text-center gap-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 font-sans text-xs font-semibold text-slate-600 uppercase tracking-wide shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-[#15349e]" />
          <span>Execution Pipeline</span>
        </div>
        <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#0a0f1d] tracking-tight">
          How It Works <span className="text-[#15349e]">· Simple &amp; Instant</span>
        </h2>
        <p className="font-sans text-base sm:text-lg text-slate-500 max-w-2xl font-normal leading-relaxed">
          Send money anywhere in seconds. We handle the complex security in the background so you can focus on what matters.
        </p>
      </div>

      {/* Clean Vertical Timeline Layout */}
      <div className="relative pl-6 sm:pl-10 md:pl-12 border-l-2 border-slate-200/80 flex flex-col gap-12 ml-4 sm:ml-8 my-4">
        
        {steps.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.step} className="relative group">
              
              {/* Timeline Circle Node on the Vertical Line */}
              <div className="absolute -left-[39px] sm:-left-[55px] md:-left-[63px] top-1 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 border-white bg-[#15349e] text-white font-bold text-sm sm:text-base shadow-[0_4px_15px_rgba(21,52,158,0.3)] group-hover:scale-110 group-hover:bg-[#102a83] transition-all">
                <span>{item.step}</span>
              </div>

              {/* Step Content Card */}
              <GlassCard className="flex flex-col gap-5 border-slate-200/80 hover:border-[#15349e]/40 transition-all p-6 sm:p-8 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#15349e]/10 text-[#15349e] border border-[#15349e]/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0a0f1d] tracking-tight">
                      {item.headline}
                    </h3>
                  </div>

                  {/* Benefit-Driven State Badge */}
                  <div className={cn("inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-bold uppercase tracking-wide self-start sm:self-auto", item.badgeColor)}>
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>State: {item.state}</span>
                  </div>
                </div>

                <p className="font-sans text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                  {item.desc}
                </p>

              </GlassCard>

            </div>
          );
        })}

      </div>

      {/* CTA Button at Bottom of Timeline */}
      <div className="flex justify-center pt-2">
        <ButtonLink
          href="/dashboard"
          variant="primary"
          size="lg"
          className="font-sans text-sm sm:text-base font-bold uppercase tracking-wide px-8 py-4 shadow-[0_4px_20px_rgba(21,52,158,0.25)] rounded-full"
        >
          <Send className="h-4 w-4 mr-2.5" />
          Send Funds Now
          <ArrowRight className="h-4 w-4 ml-2" />
        </ButtonLink>
      </div>

      {/* Terminal Logger Widget at the Bottom (Keep looking technical & cool) */}
      <div className="rounded-2xl border border-slate-800 bg-[#0a0f1d] p-5 shadow-2xl relative mt-4 text-white">
        
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 text-xs">
          <div className="flex items-center gap-2 font-sans">
            <Terminal className="h-4 w-4 text-[#3b82f6]" />
            <span className="font-bold text-slate-200 tracking-wide uppercase text-xs">
              Live Security Protocol · Background Enclave Attestation
            </span>
          </div>
          <div className="flex items-center gap-2 font-sans">
            <span className="h-2 w-2 rounded-full bg-[#3b82f6] animate-pulse" />
            <span className="text-[10px] font-bold text-[#3b82f6] tracking-wider uppercase">
              ENCLAVE ACTIVE
            </span>
          </div>
        </div>

        {/* Monospace Console Box */}
        <div
          ref={logBoxRef}
          className="bg-[#0a0f1d] text-[#3b82f6] font-mono text-xs p-4 overflow-y-auto h-36 rounded-xl border border-slate-800/80 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-white/20"
        >
          {terminalLogs.map((log, idx) => {
            let colorClass = "text-[#3b82f6]";
            if (log.startsWith("[SETTLE]")) colorClass = "text-white font-bold";
            if (log.startsWith("[VAULT]") || log.startsWith("[ATTEST]")) colorClass = "text-blue-300";
            if (log.startsWith("[SYSTEM]") || log.startsWith("[CRYPTO]")) colorClass = "text-slate-400";

            return (
              <div key={idx} className={cn("leading-relaxed break-all", colorClass)}>
                <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                <span>{log}</span>
              </div>
            );
          })}
          
          {/* Prompt */}
          <div className="flex items-center gap-2 text-[#3b82f6] pt-1">
            <span>&gt;</span>
            <span className="inline-block h-3.5 w-2 bg-[#3b82f6] animate-pulse" />
          </div>
        </div>

      </div>

    </div>
  );
}
