"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Cpu,
  Shield,
  FileCode,
  Server,
  Key,
  Lock,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Layers,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PageShell, PageContainer, GlassCard } from "@/components/ui/layout";
import { cn } from "@/lib/utils";

export default function DocsPage() {
  const [copiedContract, setCopiedContract] = useState(false);
  const [activeTab, setActiveTab] = useState<"arch" | "pod" | "contracts" | "api">("arch");

  const contractId = "CCCT6ZJ3HN3Y46NNRU2NBJGX77HXGHJXO6FU3TYIGCX3PSRSYRVRGWDE";

  const copyContract = () => {
    navigator.clipboard.writeText(contractId);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const navItems = [
    { id: "arch", label: "01 · System Architecture", icon: Layers },
    { id: "pod", label: "02 · Proof of Device (PoD)", icon: Shield },
    { id: "contracts", label: "03 · Smart Contract Details", icon: FileCode },
    { id: "api", label: "04 · API Endpoints", icon: Server },
  ] as const;

  return (
    <PageShell>
      <Navbar />

      <main className="flex-1 pb-24 pt-8 sm:pt-12 font-sans">
        <PageContainer>
          
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-8 mb-10">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#15349e]/30 bg-[#15349e]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-[#15349e]">
                <BookOpen className="h-3.5 w-3.5" />
                Technical Whitepaper
              </span>
              <span className="text-xs text-slate-500 font-bold">PROTOCOL SPECIFICATION</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#0a0f1d] sm:text-4xl lg:text-5xl">
              BeamAuth Documentation
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-slate-500 leading-relaxed font-normal">
              A frictionless on-chain settlement protocol driven by hardware secure enclaves, zero-gas relayers, and Soroban smart contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3">
              <div className="sticky top-24 flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] font-sans">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 pb-2 border-b border-slate-100">
                  NAVIGATION INDEX
                </span>
                
                <div className="flex flex-col gap-1 pt-1">
                  {navItems.map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={cn(
                          "flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-left text-xs transition-all cursor-pointer border font-bold",
                          isActive
                            ? "bg-[#15349e]/10 text-[#15349e] border-[#15349e]/20 shadow-sm"
                            : "text-slate-600 border-transparent hover:text-[#0a0f1d] hover:bg-slate-50 font-semibold"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">QUICK RESOURCES</span>
                  <a
                    href="https://github.com/yashannadate/BeamAuth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-[#15349e] p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-sm transition-all"
                  >
                    <span>GitHub Repository</span>
                    <ExternalLink className="h-3.5 w-3.5 text-[#15349e]" />
                  </a>
                  <a
                    href="https://soroban.stellar.org/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-[#15349e] p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-sm transition-all"
                  >
                    <span>Soroban Docs</span>
                    <ExternalLink className="h-3.5 w-3.5 text-[#15349e]" />
                  </a>
                </div>
              </div>
            </aside>

            {/* Content Area */}
            <div className="lg:col-span-9 flex flex-col gap-10 font-sans">
              
              {/* ══════════════════════════════════════════════════
                  SECTION 1: SYSTEM ARCHITECTURE
              ═════════════════════════════════════════════════ */}
              {(activeTab === "arch" || true) && (
                <div id="arch" className={cn("flex flex-col gap-6", activeTab !== "arch" && "hidden lg:flex")}>
                  <GlassCard className="border-slate-200/80 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl flex flex-col gap-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#15349e]/10 text-[#15349e] border border-[#15349e]/20">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#15349e] uppercase tracking-wider">
                          01 · PROTOCOL OVERVIEW
                        </span>
                        <h2 className="font-display text-2xl font-extrabold text-[#0a0f1d] tracking-tight">System Architecture</h2>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      BeamAuth is structured as a three-tier cryptographic stack designed to eliminate the historical user experience friction associated with decentralized Web3 settlement: seed phrase management, trustline requirements, and network gas fees.
                    </p>

                    {/* Architecture Diagram */}
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-6 text-xs text-slate-700 overflow-x-auto shadow-inner">
                      <div className="min-w-[500px] flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <span>BEAMAUTH THREE-LAYER SETTLEMENT STACK</span>
                          <span className="text-[#15349e]">PROTOCOL FLOW</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-4 rounded-xl border border-[#15349e]/20 bg-[#15349e]/5 flex flex-col gap-1.5 shadow-sm">
                            <span className="text-[#15349e] font-extrabold text-sm font-display">1. CIPHER TERMINAL</span>
                            <span className="text-xs font-bold text-[#0a0f1d]">Next.js Frontend / WebAuthn</span>
                            <span className="text-[11px] text-slate-500 mt-1">Hardware Enclave Attestation</span>
                          </div>
                          
                          <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col gap-1.5 shadow-sm">
                            <span className="text-[#0a0f1d] font-extrabold text-sm font-display">2. ZERO-GAS RELAYER</span>
                            <span className="text-xs font-bold text-[#0a0f1d]">Backend API / Freighter</span>
                            <span className="text-[11px] text-slate-500 mt-1">Fee-Bumping &amp; Sponsorship</span>
                          </div>
                          
                          <div className="p-4 rounded-xl border border-[#15349e]/20 bg-[#15349e]/5 flex flex-col gap-1.5 shadow-sm">
                            <span className="text-[#15349e] font-extrabold text-sm font-display">3. SOROBAN ENGINE</span>
                            <span className="text-xs font-bold text-[#0a0f1d]">Smart Contract Vaults</span>
                            <span className="text-[11px] text-slate-500 mt-1">secp256r1 Host Verification</span>
                          </div>
                        </div>

                        <div className="text-center text-xs font-semibold text-slate-600 border-t border-slate-200 pt-3">
                          <span>Sender commits asset &amp; secret</span>
                          <span className="mx-2 text-[#15349e] font-bold">━━━►</span>
                          <span>Recipient scans biometrics</span>
                          <span className="mx-2 text-[#15349e] font-bold">━━━►</span>
                          <span className="text-[#15349e] font-extrabold">Atomic Settlement ($0.00 Gas)</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                      <div className="flex flex-col gap-2 p-5 rounded-xl border border-slate-200/80 bg-slate-50/80">
                        <span className="text-sm font-bold text-[#0a0f1d] font-display">1. Biometric Cipher Terminal</span>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          The browser application interfaces directly with the device operating system (iOS, macOS, Android, Windows) via WebAuthn to generate cryptographic passkey signatures inside physical hardware silicon.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 p-5 rounded-xl border border-slate-200/80 bg-slate-50/80">
                        <span className="text-sm font-bold text-[#0a0f1d] font-display">2. Zero-Gas Relayer Sponsor</span>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          When a recipient attests biometrics to claim funds, the backend relayer wraps the payload in an atomic fee-bump transaction, paying network gas fees so recipients never need XLM.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 p-5 rounded-xl border border-slate-200/80 bg-slate-50/80">
                        <span className="text-sm font-bold text-[#0a0f1d] font-display">3. Soroban Smart Contracts</span>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          Escrow vaults hold locked native XLM under strict ledger timestamp time-locks. Upon receiving a valid biometric assertion, the contract executes atomic settlement.
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* ══════════════════════════════════════════════════
                  SECTION 2: PROOF OF DEVICE (PoD) REGISTRY
              ═════════════════════════════════════════════════ */}
              {(activeTab === "pod" || true) && (
                <div id="pod" className={cn("flex flex-col gap-6", activeTab !== "pod" && "hidden lg:flex")}>
                  <GlassCard className="border-slate-200/80 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl flex flex-col gap-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#15349e]/10 text-[#15349e] border border-[#15349e]/20">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#15349e] uppercase tracking-wider">
                          02 · SYBIL RESISTANCE PRIMITIVE
                        </span>
                        <h2 className="font-display text-2xl font-extrabold text-[#0a0f1d] tracking-tight">Proof of Device (PoD) Registry</h2>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      The Proof of Device (PoD) Registry is a Soroban smart contract that cryptographically links a Stellar account address to a physical hardware Secure Enclave (such as Apple T2/M-series chips, Android Trusted Execution Environments, or hardware YubiKeys).
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-xl border border-slate-200/80 bg-slate-50/80 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-[#15349e] font-bold text-sm font-display">
                          <Key className="h-4 w-4" />
                          <span>secp256r1 WebAuthn Attestation</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          Traditional blockchain accounts rely on secp256k1 curves. BeamAuth leverages NIST P-256 (secp256r1), the universal cryptographic standard natively embedded in modern consumer hardware processors and passkeys.
                        </p>
                      </div>

                      <div className="p-6 rounded-xl border border-slate-200/80 bg-slate-50/80 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-[#0a0f1d] font-bold text-sm font-display">
                          <Shield className="h-4 w-4 text-[#15349e]" />
                          <span>Sybil Resistance Without KYC</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          Because generating a valid WebAuthn credential requires physical user presence and biometric verification on hardware silicon, automated bot farms cannot spoof or scale fake accounts on-chain.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#15349e]/20 bg-[#15349e]/5 p-6 text-xs flex flex-col gap-3">
                      <span className="text-[#15349e] font-extrabold font-display uppercase tracking-wider">ON-CHAIN REGISTRATION LIFECYCLE</span>
                      <ol className="list-decimal list-inside text-slate-700 space-y-1.5 text-xs font-normal">
                        <li>User requests challenge payload from backend relayer anchor.</li>
                        <li>Browser invokes WebAuthn API (<code className="text-[#15349e] font-mono font-bold">navigator.credentials.create</code>).</li>
                        <li>Hardware enclave generates secp256r1 key pair and returns attestation object.</li>
                        <li>Relayer builds Soroban transaction calling <code className="text-[#15349e] font-mono font-bold">register_device()</code> on PodRegistry.</li>
                        <li>Contract stores public key mapping and emits verification event.</li>
                      </ol>
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* ══════════════════════════════════════════════════
                  SECTION 3: SMART CONTRACT DETAILS
              ═════════════════════════════════════════════════ */}
              {(activeTab === "contracts" || true) && (
                <div id="contracts" className={cn("flex flex-col gap-6", activeTab !== "contracts" && "hidden lg:flex")}>
                  <GlassCard className="border-slate-200/80 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl flex flex-col gap-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#15349e]/10 text-[#15349e] border border-[#15349e]/20">
                        <FileCode className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#15349e] uppercase tracking-wider">
                          03 · ON-CHAIN EXECUTION
                        </span>
                        <h2 className="font-display text-2xl font-extrabold text-[#0a0f1d] tracking-tight">Smart Contract Details</h2>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      BeamAuth smart contracts are written in Rust and compiled to WebAssembly (WASM) for deployment on the Stellar Soroban virtual machine.
                    </p>

                    {/* Contract Address Box */}
                    <div className="rounded-xl border border-[#15349e]/20 bg-[#15349e]/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-[#15349e] font-bold uppercase tracking-wider">
                          LIVE POD REGISTRY CONTRACT · SOROBAN TESTNET
                        </span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-[#0a0f1d] break-all">{contractId}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0 font-sans">
                        <button
                          type="button"
                          onClick={copyContract}
                          className="px-4 py-2.5 rounded-full bg-[#15349e] text-white hover:bg-[#102a83] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_4px_15px_rgba(21,52,158,0.25)]"
                        >
                          {copiedContract ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedContract ? "Copied" : "Copy ID"}</span>
                        </button>
                        <a
                          href={`https://stellar.expert/explorer/testnet/contract/${contractId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-full border border-slate-200 bg-white text-slate-700 hover:border-[#15349e] hover:text-[#15349e] text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <span>Explorer</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Soroban Host Functions & Time-Locks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="p-6 rounded-xl border border-slate-200/80 bg-slate-50/80 flex flex-col gap-3">
                        <span className="text-sm font-bold text-[#0a0f1d] font-display">
                          secp256r1 Host Verification
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          Soroban provides native cryptographic primitives via <code className="text-[#15349e] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">env.crypto().secp256r1_verify()</code>. This enables contracts to validate WebAuthn passkey signatures on-chain with minimal CPU and gas overhead.
                        </p>
                      </div>

                      <div className="p-6 rounded-xl border border-slate-200/80 bg-slate-50/80 flex flex-col gap-3">
                        <span className="text-sm font-bold text-[#0a0f1d] font-display">
                          Time-Locked Escrow &amp; Refunds
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          Escrow vaults record ledger timestamps upon commitment. If an asset is not claimed within the specified duration (e.g., 17,280 ledgers ~ 24 hours), the time-lock expires and funds can be cleanly refunded to the sender.
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* ══════════════════════════════════════════════════
                  SECTION 4: API ENDPOINTS
              ═════════════════════════════════════════════════ */}
              {(activeTab === "api" || true) && (
                <div id="api" className={cn("flex flex-col gap-6", activeTab !== "api" && "hidden lg:flex")}>
                  <GlassCard className="border-slate-200/80 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl flex flex-col gap-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#15349e]/10 text-[#15349e] border border-[#15349e]/20">
                        <Server className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#15349e] uppercase tracking-wider">
                          04 · BACKEND RELAYER SERVICES
                        </span>
                        <h2 className="font-display text-2xl font-extrabold text-[#0a0f1d] tracking-tight">API Endpoints</h2>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      The Next.js backend API routes handle challenge generation, signature normalization, transaction building, and zero-gas fee-bumping.
                    </p>

                    {/* Endpoint 1 */}
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-6 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-[#15349e] text-white font-bold text-xs shadow-sm">
                          GET
                        </span>
                        <code className="text-xs sm:text-sm font-mono font-bold text-[#0a0f1d]">
                          /api/pod/challenge?userAddress=0x...
                        </code>
                      </div>
                      <p className="text-xs text-slate-600 font-normal">
                        Generates a cryptographic WebAuthn registration or authentication challenge bound to the user&apos;s Stellar address and relayer relying party (RP) ID.
                      </p>
                    </div>

                    {/* Endpoint 2 */}
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-6 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300">
                          POST
                        </span>
                        <code className="text-xs sm:text-sm font-mono font-bold text-[#0a0f1d]">
                          /api/pod/register
                        </code>
                      </div>
                      <p className="text-xs text-slate-600 font-normal">
                        Accepts raw WebAuthn registration/assertion responses from the browser, normalizes secp256r1 signatures, constructs unsigned Soroban XDR, or submits sponsored XDR to the network.
                      </p>
                      <div className="bg-[#0a0f1d] p-4 rounded-xl border border-slate-800 text-xs text-[#3b82f6] font-mono shadow-inner">
                        <pre className="overflow-x-auto">{`// Request Payload Signature
{
  "action": "build" | "submit",
  "userAddress": "G...",
  "registrationResponse": { ... },
  "assertionResponse": { ... }
}`}</pre>
                      </div>
                    </div>

                    {/* Endpoint 3 */}
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-6 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300">
                          POST
                        </span>
                        <code className="text-xs sm:text-sm font-mono font-bold text-[#0a0f1d]">
                          /api/relay
                        </code>
                      </div>
                      <p className="text-xs text-slate-600 font-normal">
                        The Zero-Gas Relayer endpoint. Wraps target claim transactions in a Soroban fee-bump transaction signed by the protocol sponsor account, paying network gas fees on behalf of the recipient.
                      </p>
                    </div>
                  </GlassCard>
                </div>
              )}

            </div>
          </div>
        </PageContainer>
      </main>

      <Footer />
    </PageShell>
  );
}
