"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  Fingerprint,
  Shield,
  Rocket,
  Loader2,
  Check,
  ExternalLink,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { GlassCard, PageShell, PageContainer } from "@/components/ui/layout";

type ClaimState = "idle" | "loading" | "success" | "error";

function ClaimPageInner() {
  const searchParams = useSearchParams();
  const secret = searchParams.get("secret");
  const isDemo = searchParams.get("demo") === "true";

  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [walletAddr, setWalletAddr] = useState("");
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);

  const senderDisplay = isDemo ? "Alice" : "Your friend";
  const amountDisplay = isDemo ? "50" : "??";
  const tokenDisplay = "XLM";

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

    // Guard against the race between relay response and event listener
    let settled = false;
    const settle = (wallet: string, hash: string) => {
      if (settled) return;
      settled = true;
      setWalletAddr((prev) => prev || wallet);
      setTxHash((prev) => prev || hash);
      setClaimState("success");
    };
    const fail = (msg: string) => {
      if (settled) return;
      settled = true;
      setErrorMsg(msg);
      setClaimState("error");
    };

    try {
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 3500));
        settle(
          "GDEMO7BEAMAUTH" + Math.random().toString(36).slice(2, 10).toUpperCase(),
          "TXDEMO" + Math.random().toString(36).slice(2, 18).toUpperCase(),
        );
        return;
      }

      const { startRegistration } = await import("@simplewebauthn/browser");
      const rpcUrl = (process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org").trim();
      const escrowId = (process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || "").trim();

      const { rpc: StellarRpc } = await import("@stellar/stellar-sdk");
      const server = new StellarRpc.Server(rpcUrl);
      let startLedger = 0;
      try {
        const latest = await server.getLatestLedger();
        startLedger = latest.sequence;
      } catch (e) {
        console.warn("Failed to get latest ledger:", e);
      }

      const challengeRes = await fetch("/api/webauthn/challenge", { method: "GET" });
      if (!challengeRes.ok) throw new Error("Failed to get challenge from server.");
      const challengeOptions = await challengeRes.json();
      const authResponse = await startRegistration(challengeOptions);

      const listenForEvent = async () => {
        for (let i = 0; i < 30; i++) {
          if (settled) return;
          await new Promise((r) => setTimeout(r, 2000));
          try {
            const response = await server.getEvents({
              startLedger,
              filters: [{ type: "contract", contractIds: [escrowId], topics: [["AAAADwAAAAdjbGFpbWVkAA=="]] }],
              limit: 10,
            });
            if (response.events.length > 0) {
              const event = response.events[0];
              settle(
                event.contractId ? event.contractId.toString() : "Deployed Wallet",
                event.txHash,
              );
              break;
            }
          } catch (e) {
            console.error("[Event Stream] Polling error:", e);
          }
        }
      };

      // Both fire concurrently — the `settled` guard ensures only the first
      // responder drives the UI transition.
      listenForEvent().catch((e) => console.error("[Event Stream] Unhandled:", e));

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
          settle(data.walletAddress, data.txHash);
        })
        .catch((err) => {
          fail(err.message || "Relay failed.");
        });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        fail("Biometric authentication was cancelled. Please try again.");
      } else {
        fail(err instanceof Error ? err.message : "Something went wrong.");
      }
    }
  };

  const steps = [
    { icon: Fingerprint, text: "Biometric passkey authentication" },
    { icon: Shield, text: "Gasless sponsored claim" },
    { icon: Rocket, text: `Instant settlement of ${amountDisplay} ${tokenDisplay}` },
  ];

  return (
    <PageShell>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <PageContainer narrow className="flex flex-col items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.35)]">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </span>
            <span className="font-display text-xl font-bold text-white">BeamAuth</span>
          </Link>

          {claimState === "idle" && (
            <GlassCard className="w-full max-w-md">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="font-display text-5xl font-bold text-white">
                  {amountDisplay}{" "}
                  <span className="text-blue-400">{tokenDisplay}</span>
                </div>
                <p className="text-sm text-slate-400">
                  From <span className="font-semibold text-white">{senderDisplay}</span>
                </p>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-blue-400">
                  Stellar Testnet Escrow
                </span>
                <div className="h-px w-full bg-white/10" />
                <ul className="flex w-full flex-col gap-3 text-left text-sm text-slate-400">
                  {steps.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0 text-blue-400" />
                      {text}
                    </li>
                  ))}
                </ul>
                <Button variant="primary" size="lg" fullWidth onClick={handleClaim}>
                  <Fingerprint className="h-5 w-5" />
                  Verify &amp; Claim
                </Button>
              </div>
            </GlassCard>
          )}

          {claimState === "loading" && (
            <GlassCard className="w-full max-w-md">
              <div className="flex flex-col items-center gap-6 py-4 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
                <h2 className="font-display text-xl font-bold text-white">Processing Claim</h2>
                <p className="text-sm text-slate-400">
                  Verifying biometrics and settling on-chain…
                </p>
                <p className="font-mono text-xs text-blue-400">{timeElapsed}s elapsed</p>
              </div>
            </GlassCard>
          )}

          {claimState === "success" && (
            <GlassCard className="w-full max-w-md">
              <div className="flex flex-col items-center gap-6 py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                  <Check className="h-7 w-7 text-emerald-400" />
                </div>
                <h2 className="font-display text-xl font-bold text-white">Assets Claimed</h2>
                <p className="text-sm text-slate-400">
                  {amountDisplay} {tokenDisplay} transferred to your wallet.
                </p>
                <div className="w-full rounded-xl border border-white/15 bg-black/40">
                  <input
                    type="text"
                    readOnly
                    value={walletAddr}
                    className="w-full bg-transparent px-4 py-3 font-mono text-xs text-white outline-none"
                  />
                </div>
                <ButtonLink
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  variant="outline"
                  fullWidth
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Transaction <ExternalLink className="h-4 w-4" />
                </ButtonLink>
                <Link href="/" className="flex items-center gap-1 text-xs text-slate-500 hover:text-white">
                  <ArrowLeft className="h-3 w-3" /> Back to Home
                </Link>
              </div>
            </GlassCard>
          )}

          {claimState === "error" && (
            <GlassCard className="w-full max-w-md">
              <div className="flex flex-col items-center gap-6 py-4 text-center">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <h2 className="font-display text-xl font-bold text-white">Claim Failed</h2>
                <div className="w-full rounded-xl border border-red-500/35 bg-red-950/30 p-4 text-sm text-red-300">
                  {errorMsg}
                </div>
                <Button variant="primary" fullWidth onClick={() => setClaimState("idle")}>
                  Try Again
                </Button>
                <Link href="/" className="flex items-center gap-1 text-xs text-slate-500 hover:text-white">
                  <ArrowLeft className="h-3 w-3" /> Back to Home
                </Link>
              </div>
            </GlassCard>
          )}
        </PageContainer>
      </main>
    </PageShell>
  );
}

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <PageShell className="items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </PageShell>
      }
    >
      <ClaimPageInner />
    </Suspense>
  );
}
