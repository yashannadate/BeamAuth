import Link from "next/link";
import Navbar from "@/components/Navbar";
import HyperspaceCanvasClient from "@/components/HyperspaceCanvasClient";

// ── Feature pill data ────────────────────────────────────────────────────────
const FEATURES = [
  { icon: "🔐", label: "No Seed Phrases" },
  { icon: "⚡", label: "Zero Gas for Users" },
  { icon: "🌐", label: "Stellar Protocol 27" },
  { icon: "📱", label: "FaceID Native" },
];

// ── How it works steps ───────────────────────────────────────────────────────
const STEPS = [
  {
    id: "01",
    title: "Lock Funds",
    desc: "Connect your Stellar wallet and deposit USDC into the Soroban Escrow contract. Generate a claim link in one click.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/>
      </svg>
    ),
  },
  {
    id: "02",
    title: "Share the Link",
    desc: "Copy the secure claim URL and send it via text, email, or any messenger. No wallet required to receive.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"/>
      </svg>
    ),
  },
  {
    id: "03",
    title: "Claim with FaceID",
    desc: "Receiver clicks the link on mobile. One tap triggers FaceID. Your phone's hardware generates a cryptographic key.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
      </svg>
    ),
  },
  {
    id: "04",
    title: "Instant Settlement",
    desc: "Our relayer deploys a smart wallet for them, pays their gas, and releases the USDC atomically — in under 5 seconds.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/>
      </svg>
    ),
  },
];

// ── Stat bar ─────────────────────────────────────────────────────────────────
const STATS = [
  { value: "< 5s",   label: "Claim Time"     },
  { value: "$0",     label: "Gas for Users"  },
  { value: "100%",   label: "Non-Custodial"  },
  { value: "secp256r1", label: "On-Chain Auth" },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-beam-black overflow-hidden">
      <Navbar />

      {/* ════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════ */}
      <section
        id="hero"
        className="relative min-h-screen grid lg:grid-cols-2"
        aria-label="Hero"
      >
        {/* ── Ambient background glow ── */}
        <div
          className="glow-orb glow-orb-blue absolute"
          style={{ width: 600, height: 600, top: "10%", left: "-10%", opacity: 0.4 }}
          aria-hidden="true"
        />
        <div
          className="glow-orb glow-orb-cyan absolute"
          style={{ width: 300, height: 300, top: "60%", left: "20%", opacity: 0.25 }}
          aria-hidden="true"
        />

        {/* Grid bg overlay */}
        <div className="absolute inset-0 grid-bg opacity-100 pointer-events-none" aria-hidden="true" />

        {/* ── LEFT PANEL ── */}
        <div className="relative z-10 flex flex-col justify-center px-6 sm:px-12 lg:px-20 pt-28 pb-16 lg:pt-0">

          {/* Badge */}
          <div className="animate-fade-up animate-delay-100">
            <span className="feature-badge">
              <span className="glow-dot w-1.5 h-1.5" />
              Stellar Protocol 27 · Soroban Smart Contracts
            </span>
          </div>

          {/* Headline */}
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight animate-fade-up animate-delay-200">
            Power seamless{" "}
            <br className="hidden sm:block" />
            <span className="gradient-text">Web3 UX</span>{" "}
            <br className="hidden sm:block" />
            with <span className="gradient-text-blue">BeamAuth.</span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-6 text-lg sm:text-xl text-beam-muted leading-relaxed max-w-xl animate-fade-up animate-delay-300">
            Transact on Stellar without bridging, gas fees, or seed phrases.
            Send USDC via a link. Your recipient claims it with{" "}
            <span className="text-beam-blue-lit font-medium">Face ID</span> — no wallet needed.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap gap-4 animate-fade-up animate-delay-400">
            <Link
              href="/dashboard"
              className="btn-primary text-base px-7 py-3"
              id="hero-cta-get-started"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
                <path d="M3 3h18v4H3V3zm0 7h12v4H3v-4zm0 7h8v4H3v-4z" opacity=".4"/>
                <path d="M18 13l-5 5v-3.5H10v-3h3V8l5 5z"/>
              </svg>
              Get Started
            </Link>
            <a
              href="https://docs.stellar.org/build/smart-contracts"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline text-base px-7 py-3"
              id="hero-cta-view-docs"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/>
              </svg>
              View Docs
            </a>
          </div>

          {/* Feature pills */}
          <div className="mt-10 flex flex-wrap gap-3 animate-fade-up animate-delay-500">
            {FEATURES.map((f) => (
              <span
                key={f.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-sm text-beam-muted hover:text-white hover:border-blue-500/30 transition-all duration-300"
              >
                <span>{f.icon}</span>
                {f.label}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="mt-14 pt-8 border-t border-beam-border grid grid-cols-2 sm:grid-cols-4 gap-6 animate-fade-up animate-delay-600">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold gradient-text-blue">{s.value}</div>
                <div className="text-xs text-beam-muted mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL — Three.js Canvas ── */}
        <div
          className="relative lg:block hidden"
          aria-hidden="true"
        >
          <HyperspaceCanvasClient />

          {/* Floating glass card overlay */}
          <div
            className="absolute bottom-12 left-8 right-8 glass-card rounded-2xl p-5 z-10"
            style={{ backdropFilter: "blur(24px)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="glow-dot" />
              <span className="text-xs font-semibold text-beam-muted uppercase tracking-widest">Live Network Activity</span>
            </div>
            <div className="space-y-2">
              {[
                { addr: "GABCD…X7YZ", action: "Claimed 12 USDC",  time: "2s ago",  status: "success" },
                { addr: "GZXYZ…A1BC", action: "Wallet deployed",   time: "8s ago",  status: "success" },
                { addr: "GQRST…M3NP", action: "Locked 50 USDC",   time: "21s ago", status: "pending" },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tx.status === "success" ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]" : "bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.6)]"}`} />
                    <span className="font-mono text-beam-muted">{tx.addr}</span>
                  </div>
                  <span className="text-white/60">{tx.action}</span>
                  <span className="text-beam-muted/60">{tx.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          HOW IT WORKS SECTION
          ════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="relative py-32 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto"
        aria-labelledby="how-it-works-heading"
      >
        {/* Section glow */}
        <div className="glow-orb glow-orb-blue absolute right-0 top-1/2 -translate-y-1/2 opacity-20" style={{ width: 500, height: 500 }} aria-hidden="true" />

        <div className="text-center mb-20 relative z-10">
          <span className="feature-badge mb-4 inline-block">The Flow</span>
          <h2
            id="how-it-works-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight"
          >
            From wallet to{" "}
            <span className="gradient-text-blue">biometric claim</span>
            <br />in under 15 seconds.
          </h2>
          <p className="mt-4 text-beam-muted text-lg max-w-2xl mx-auto">
            Powered by Soroban smart contracts, secp256r1 passkeys, and fee-sponsored relayer transactions.
          </p>
        </div>

        <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-6 z-10">
          {/* Connecting line (desktop) */}
          <div
            className="absolute top-12 left-[12.5%] right-[12.5%] h-px hidden lg:block"
            style={{ background: "linear-gradient(90deg, rgba(37,99,235,0.1), rgba(96,165,250,0.4), rgba(37,99,235,0.1))" }}
            aria-hidden="true"
          />

          {STEPS.map((step) => (
            <div
              key={step.id}
              className="glass-card-hover rounded-2xl p-6 flex flex-col gap-4 relative"
              id={`step-${step.id}`}
            >
              {/* Step number badge */}
              <div className="absolute -top-3 left-6 feature-badge text-[10px]">
                {step.id}
              </div>

              {/* Icon circle */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/30 to-blue-900/30 border border-blue-500/20 flex items-center justify-center text-blue-400">
                {step.icon}
              </div>

              <h3 className="text-lg font-bold text-white">{step.title}</h3>
              <p className="text-sm text-beam-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════
          ARCHITECTURE SECTION
          ════════════════════════════════════ */}
      <section
        id="features"
        className="py-24 px-6 sm:px-12 lg:px-20"
        aria-labelledby="arch-heading"
      >
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden">
            {/* BG glow */}
            <div className="glow-orb glow-orb-blue absolute -right-20 -top-20 opacity-30" style={{ width: 400, height: 400 }} aria-hidden="true" />

            <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="feature-badge mb-4 inline-block">Smart Contract Stack</span>
                <h2 id="arch-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">
                  Three Soroban contracts.
                  <br />
                  <span className="gradient-text-blue">One atomic transaction.</span>
                </h2>
                <p className="text-beam-muted text-lg leading-relaxed mb-8">
                  The Escrow Vault holds USDC. The Wallet Factory deploys a
                  secp256r1 Passkey Smart Account. Both execute atomically in a
                  single fee-bumped transaction — paid by our relayer, not the user.
                </p>
                <Link href="/dashboard" className="btn-primary inline-flex" id="arch-cta">
                  Try It Now →
                </Link>
              </div>

              {/* Contract diagram */}
              <div className="space-y-4 font-mono text-sm">
                {[
                  {
                    name: "EscrowVault",
                    color: "from-blue-500/20 to-blue-800/20 border-blue-500/30",
                    dot: "bg-blue-400",
                    fns: ["lock_funds(sender, hash, amount)", "claim_funds(secret, wallet)"],
                  },
                  {
                    name: "WalletFactory",
                    color: "from-cyan-500/20 to-cyan-800/20 border-cyan-500/30",
                    dot: "bg-cyan-400",
                    fns: ["deploy_wallet(pub_key) → Address"],
                  },
                  {
                    name: "PasskeyWallet",
                    color: "from-indigo-500/20 to-indigo-800/20 border-indigo-500/30",
                    dot: "bg-indigo-400",
                    fns: ["__check_auth(sig_payload, sig)", "verify_sig_ecdsa_secp256r1()"],
                  },
                ].map((contract) => (
                  <div
                    key={contract.name}
                    className={`rounded-xl border bg-gradient-to-br ${contract.color} p-4`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-2 h-2 rounded-full ${contract.dot} shadow-[0_0_6px_2px_rgba(96,165,250,0.4)]`} />
                      <span className="text-white font-bold">{contract.name}</span>
                      <span className="ml-auto text-xs text-beam-muted bg-white/5 px-2 py-0.5 rounded">Soroban · Rust</span>
                    </div>
                    {contract.fns.map((fn) => (
                      <div key={fn} className="text-xs text-beam-muted/80 pl-4 border-l border-white/10 mt-1">
                        {fn}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          CTA BANNER
          ════════════════════════════════════ */}
      <section className="py-24 px-6 text-center relative overflow-hidden" aria-label="Call to action">
        <div className="glow-orb glow-orb-blue absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" style={{ width: 700, height: 400 }} aria-hidden="true" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Ready to onboard{" "}
            <span className="gradient-text">the next billion</span>
            <br />into Web3?
          </h2>
          <p className="text-beam-muted text-lg mb-10">
            No seed phrases. No downloads. No gas. Just a link and a fingerprint.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard" className="btn-primary text-lg px-10 py-4" id="bottom-cta-start">
              Start Sending →
            </Link>
            <Link href="/claim?demo=true" className="btn-outline text-lg px-10 py-4" id="bottom-cta-demo">
              See Claim Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t border-beam-border text-center" role="contentinfo">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-4">
          <div className="flex items-center gap-2 text-beam-muted text-sm">
            <span className="glow-dot w-2 h-2" />
            <span>BeamAuth · Built on Stellar Soroban</span>
          </div>
          <div className="flex gap-6 text-sm text-beam-muted">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" id="footer-github">GitHub</a>
            <a href="https://docs.stellar.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" id="footer-docs">Docs</a>
            <Link href="/claim" className="hover:text-white transition-colors" id="footer-claim">Claim</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
