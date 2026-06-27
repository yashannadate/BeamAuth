"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
type ClaimState = "idle" | "loading" | "success" | "error";

function ClaimPageInner() {
  const searchParams  = useSearchParams();
  const secret        = searchParams.get("secret");
  const isDemo        = searchParams.get("demo") === "true";

  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [walletAddr,  setWalletAddr] = useState<string>("");
  const [txHash,      setTxHash]     = useState<string>("");
  const [errorMsg,    setErrorMsg]   = useState<string>("");
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Demo: mock sender data
  const senderDisplay  = isDemo ? "Alice" : "Your friend";
  const amountDisplay  = isDemo ? "50" : "??";
  const tokenDisplay   = "USDC";

  // Timer on loading
  useEffect(() => {
    if (claimState !== "loading") return;
    const id = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [claimState]);

  const handleClaim = async () => {
    if (!secret && !isDemo) {
      setErrorMsg("Invalid claim link — no secret found in the URL.");
      setClaimState("error");
      return;
    }

    setClaimState("loading");
    setTimeElapsed(0);
    setErrorMsg("");

    try {
      if (isDemo) {
        // Demo mode: simulate the full flow
        await new Promise((r) => setTimeout(r, 3500));
        setWalletAddr("GDEMO7BEAMAUTH" + Math.random().toString(36).slice(2, 10).toUpperCase());
        setTxHash("TXDEMO" + Math.random().toString(36).slice(2, 18).toUpperCase());
        setClaimState("success");
        return;
      }

      // Real flow: trigger WebAuthn FaceID (Phase 4 will fully wire this)
      const { startAuthentication } = await import("@simplewebauthn/browser");

      const rpcUrl = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
      const escrowId = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || "";

      // Fetch current ledger sequence to start event polling from this ledger
      const { rpc: StellarRpc } = await import("@stellar/stellar-sdk");
      const server = new StellarRpc.Server(rpcUrl);
      let startLedger = 0;
      try {
        const latestLedgerRes = await server.getLatestLedger();
        startLedger = latestLedgerRes.sequence;
      } catch (e) {
        console.warn("Failed to get latest ledger sequence from RPC, default to 0:", e);
      }

      // GET challenge from server
      const challengeRes = await fetch("/api/webauthn/challenge", { method: "GET" });
      if (!challengeRes.ok) throw new Error("Failed to get challenge from server.");
      const challengeOptions = await challengeRes.json();

      // Trigger OS biometric prompt
      const authResponse = await startAuthentication(challengeOptions);

      // Start listening to contract events on the Stellar blockchain in parallel
      const listenForEventOnChain = async () => {
        for (let i = 0; i < 30; i++) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          try {
            const response = await server.getEvents({
              startLedger,
              filters: [
                {
                  type: "contract",
                  contractIds: [escrowId],
                  topics: [["AAAADgAAAAdjbGFpbWVkAAAAAAA="]], // "claimed" symbol in XDR
                },
              ],
              limit: 10,
            });

            if (response.events.length > 0) {
              const event = response.events[0];
              const eventData = event.value;
              const amount = eventData.vec()?.[1]?.i128()?.toString() ?? "unknown";
              console.log(`[Event Stream] Claimed event caught on-chain! Amount: ${amount}`);
              
              setWalletAddr((prev) => prev || (event.contractId ? event.contractId.toString() : "Deployed Wallet"));
              setTxHash((prev) => prev || event.txHash);
              setClaimState((prev) => {
                if (prev === "success") return prev;
                return "success";
              });
              break;
            }
          } catch (e) {
            console.error("[Event Stream] Polling error:", e);
          }
        }
      };

      // Fire off background event poller
      listenForEventOnChain();

      // POST to relay endpoint
      fetch("/api/relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, webauthnResponse: authResponse }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Relay failed.");
          }
          const data = await res.json();
          setWalletAddr((prev) => prev || data.walletAddress);
          setTxHash((prev) => prev || data.txHash);
          setClaimState((prev) => {
            if (prev === "success") return prev;
            return "success";
          });
        })
        .catch((err) => {
          setClaimState((prev) => {
            if (prev === "success") return prev; // Ignore API error if on-chain event poller succeeded
            setErrorMsg(err.message || "Relay failed.");
            return "error";
          });
        });

    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error && err.name === "NotAllowedError") {
        setErrorMsg("Biometric authentication was cancelled. Please try again.");
      } else if (err instanceof Error) {
        setErrorMsg(err.message || "Something went wrong. Please try again.");
      } else {
        setErrorMsg("Something went wrong. Please try again.");
      }
      setClaimState("error");
    }
  };

  return (
    <main
      className="min-h-screen bg-beam-black flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      id="claim-page"
    >
      {/* ── Ambient glow ── */}
      <div
        className="glow-orb glow-orb-blue absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none"
        style={{ width: 500, height: 500 }}
        aria-hidden="true"
      />
      <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true" />

      {/* ── Top logo ── */}
      <Link href="/" className="flex items-center gap-2 mb-12 relative z-10" id="claim-logo">
        <div className="w-8 h-8 rounded-full border border-blue-500/50 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_8px_2px_rgba(37,99,235,0.6)]" />
        </div>
        <span className="text-base font-bold text-white">Beam<span className="text-blue-400">Auth</span></span>
      </Link>

      {/* ════════════════════
          IDLE STATE
          ════════════════════ */}
      {claimState === "idle" && (
        <div className="relative z-10 w-full max-w-sm">
          {/* Main card */}
          <div className="glass-card rounded-3xl p-8 sm:p-10 text-center animate-fade-up">
            {/* Avatar ring */}
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-600/30 to-blue-900/30 border-2 border-blue-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
              <span className="text-3xl">💸</span>
            </div>

            {/* Amount display */}
            <div className="mb-2">
              <span className="text-5xl font-extrabold gradient-text-blue">{amountDisplay}</span>
              <span className="text-2xl font-bold text-beam-muted ml-2">{tokenDisplay}</span>
            </div>
            <p className="text-sm text-beam-muted mb-1">
              Sent by <span className="text-white font-semibold">{senderDisplay}</span>
            </p>
            <p className="text-xs text-beam-muted/60 mb-8">on Stellar Testnet via BeamAuth</p>

            {/* Divider */}
            <div className="beam-divider mb-8" />

            {/* What happens */}
            <div className="space-y-3 text-left mb-8">
              {[
                { icon: "🔐", text: "Verify your identity with Face ID" },
                { icon: "⚡", text: "We deploy a smart wallet for you" },
                { icon: "✅", text: `${amountDisplay} ${tokenDisplay} lands in your wallet` },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-beam-muted">
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            {/* THE MAIN CLAIM BUTTON */}
            <button
              id="claim-faceid-button"
              onClick={handleClaim}
              className="btn-mega"
              aria-label="Tap to claim with Face ID"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 flex-shrink-0" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
              </svg>
              Tap to Claim with Face ID
            </button>

            <p className="mt-4 text-xs text-beam-muted/60">
              No app download · No seed phrase · Zero gas fees
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════
          LOADING STATE
          ════════════════════ */}
      {claimState === "loading" && (
        <div className="relative z-10 w-full max-w-sm text-center animate-fade-up">
          <div className="glass-card rounded-3xl p-10">

            {/* Animated rings */}
            <div className="relative mx-auto w-24 h-24 mb-8">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping" style={{ animationDuration: "1.5s" }} />
              <div className="absolute inset-2 rounded-full border-2 border-blue-400/50 animate-ping" style={{ animationDuration: "1.8s", animationDelay: "0.2s" }} />
              <div className="absolute inset-4 rounded-full border-t-2 border-r-2 border-blue-400 animate-spin" style={{ animationDuration: "1s" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Deploying Smart Account…</h2>
            <p className="text-sm text-beam-muted mb-6">
              Our relayer is building your wallet on Stellar
            </p>

            {/* Step progress */}
            <div className="space-y-3 text-left">
              {[
                { label: "Verifying biometric signature",    done: timeElapsed >= 1 },
                { label: "Deploying Passkey Wallet contract", done: timeElapsed >= 2 },
                { label: "Releasing USDC from Escrow",       done: timeElapsed >= 3 },
                { label: "Confirming on Stellar network",    done: timeElapsed >= 4 },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-500 ${
                    step.done
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                      : "border border-beam-border"
                  }`}>
                    {step.done && (
                      <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <span className={step.done ? "text-white" : "text-beam-muted"}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs text-beam-muted/60 font-mono">
              {timeElapsed}s elapsed
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════
          SUCCESS STATE
          ════════════════════ */}
      {claimState === "success" && (
        <div className="relative z-10 w-full max-w-sm animate-fade-up">
          <div className="glass-card rounded-3xl p-10 text-center">

            {/* Success checkmark */}
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 border border-emerald-500/40 shadow-[0_0_30px_rgba(52,211,153,0.3)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
                  <path d="M5 13l4 4L19 7" stroke="#34d399" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-white mb-1">You&apos;re in Web3! 🎉</h2>
            <p className="text-beam-muted text-sm mb-6">
              {amountDisplay} {tokenDisplay} has been deposited to your new smart wallet.
            </p>

            <div className="beam-divider mb-6" />

            {/* Wallet address */}
            <div className="bg-white/[0.04] border border-beam-border rounded-xl p-4 mb-4">
              <p className="text-xs text-beam-muted uppercase tracking-wider mb-2">Your Wallet Address</p>
              <p className="font-mono text-xs text-blue-300 break-all">{walletAddr}</p>
            </div>

            {/* TX hash */}
            <div className="bg-white/[0.04] border border-beam-border rounded-xl p-4 mb-6">
              <p className="text-xs text-beam-muted uppercase tracking-wider mb-2">Transaction</p>
              <p className="font-mono text-xs text-emerald-400 break-all">{txHash}</p>
            </div>

            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline w-full mb-4"
              id="claim-view-tx"
            >
              View on Stellar Explorer ↗
            </a>
            <Link href="/" className="text-sm text-beam-muted hover:text-white transition-colors" id="claim-back-home">
              Back to BeamAuth →
            </Link>
          </div>
        </div>
      )}

      {/* ════════════════════
          ERROR STATE
          ════════════════════ */}
      {claimState === "error" && (
        <div className="relative z-10 w-full max-w-sm animate-fade-up">
          <div className="glass-card rounded-3xl p-10 text-center border-red-500/20">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-6">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                  stroke="#f87171" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-beam-muted mb-8">{errorMsg}</p>
            <button onClick={() => setClaimState("idle")} className="btn-primary w-full" id="claim-retry">
              Try Again
            </button>
            <Link href="/" className="block mt-4 text-sm text-beam-muted hover:text-white transition-colors">
              Return to Home
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Suspense wrapper (required for useSearchParams in App Router) ────────────
export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-beam-black flex items-center justify-center">
        <div className="spinner w-10 h-10" />
      </div>
    }>
      <ClaimPageInner />
    </Suspense>
  );
}
