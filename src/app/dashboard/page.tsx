import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Dashboard — BeamAuth",
  description: "Lock USDC and generate a claim link for your recipient.",
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-beam-black" id="dashboard-page">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <div className="mb-12">
          <span className="feature-badge mb-4 inline-block">Phase 3 — Coming Soon</span>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            Lock Funds &amp; Generate Link
          </h1>
          <p className="text-beam-muted text-lg">
            Connect your Freighter wallet to lock USDC in the Soroban Escrow contract
            and generate a shareable claim link for your recipient.
          </p>
        </div>

        {/* Placeholder card */}
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-blue-400" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-3">Dashboard Unlocked in Phase 3</h2>
          <p className="text-beam-muted mb-8 max-w-md mx-auto text-sm">
            The full Freighter wallet connection + Soroban escrow locking UI will be built
            during Phase 3 (API Relayer &amp; Frontend Integration).
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/" className="btn-outline" id="dashboard-back-home">← Back to Home</Link>
            <Link href="/claim?demo=true" className="btn-primary" id="dashboard-demo-claim">
              Try Claim Demo →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
