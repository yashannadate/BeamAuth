"use client";

import { useState, useEffect } from "react";
import {
  Lock,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Wallet,
  Droplets,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useWallet } from "@/context/WalletContext";
import { getXlmBalance, buildLockFundsTx, submitSignedTx } from "@/lib/stellar-client";
import { Button } from "@/components/ui/button";
import { GlassCard, PageShell, PageContainer } from "@/components/ui/layout";
import { cn } from "@/lib/utils";

type TxStatus = "idle" | "building" | "signing" | "submitting" | "success" | "error";

export default function DashboardPage() {
  const { walletAddress, connecting, connectionError, connectWallet } = useWallet();
  const [xlmBalance, setXlmBalance] = useState("0");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [amount, setAmount] = useState("");
  const [secret, setSecret] = useState("");

  // Clear stale error states when the user edits the form after an error
  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (status === "error") { setStatus("idle"); setErrorMsg(""); }
  };
  const handleSecretChange = (val: string) => {
    setSecret(val);
    if (status === "error") { setStatus("idle"); setErrorMsg(""); }
  };
  const [duration, setDuration] = useState(17280);
  const [status, setStatus] = useState<TxStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);
  const [balanceRefetch, setBalanceRefetch] = useState(0);

  useEffect(() => {
    if (!walletAddress) return;
    let active = true;

    const load = async () => {
      setLoadingBalance(true);
      try {
        const bal = await getXlmBalance(walletAddress);
        if (active) setXlmBalance(bal);
      } catch (err) {
        console.error("Failed to load XLM balance", err);
      } finally {
        if (active) setLoadingBalance(false);
      }
    };

    load();
    return () => { active = false; };
  }, [walletAddress, balanceRefetch]);

  const generateRandomSecret = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    setSecret(Array.from(array, (b) => chars.charAt(b % chars.length)).join(""));
  };

  const handleLockFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return;
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMsg("Please enter a valid amount greater than zero.");
      setStatus("error");
      return;
    }
    if (!secret) {
      setErrorMsg("Please enter or generate a secret key.");
      setStatus("error");
      return;
    }

    try {
      setStatus("building");
      setErrorMsg("");
      const xdr = await buildLockFundsTx(walletAddress, secret, amount, duration);

      setStatus("signing");
      const { signTransaction } = await import("@stellar/freighter-api");
      const signedRes = await signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
      if (!signedRes || signedRes.error) throw new Error(signedRes?.error || "Freighter signature rejected.");

      setStatus("submitting");
      const hash = await submitSignedTx(signedRes.signedTxXdr);
      setTxHash(hash);
      setStatus("success");
      setBalanceRefetch((n) => n + 1);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      setStatus("error");
    }
  };

  const claimLink = typeof window !== "undefined"
    ? `${window.location.origin}/claim?secret=${encodeURIComponent(secret)}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(claimLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setAmount("");
    setSecret("");
    setTxHash("");
    setStatus("idle");
  };

  const busy = status !== "idle" && status !== "error";

  const inputClass =
    "w-full bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600";

  return (
    <PageShell>
      <Navbar />

      <main className="flex-1 pb-12 pt-24 sm:pt-28">
        <PageContainer className="flex flex-col gap-10">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-white/10 pb-8">
            <span className="inline-flex w-fit items-center gap-2 rounded-md border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-blue-400">
              <Lock className="h-3 w-3" />
              Soroban Escrow Terminal
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Sender Portal
            </h1>
            <p className="max-w-xl text-slate-400">
              Lock native XLM into non-custodial Soroban smart contracts and generate passkey claim links.
            </p>
          </div>

          {!walletAddress ? (
            <GlassCard className="mx-auto flex max-w-md flex-col items-center gap-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10">
                <Wallet className="h-8 w-8 text-blue-400" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="font-display text-xl font-bold text-white">Connect Your Wallet</h2>
                <p className="text-sm text-slate-400">
                  Connect Freighter to view balances and lock native XLM into non-custodial escrow vaults.
                </p>
              </div>
              <Button variant="primary" size="lg" fullWidth onClick={connectWallet} disabled={connecting}>
                {connecting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</>
                ) : (
                  <><Wallet className="h-4 w-4" /> Connect Freighter Wallet</>
                )}
              </Button>
              {connectionError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/35 bg-red-950/30 p-4 text-sm text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {connectionError}
                </div>
              )}
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Form column */}
              <div className="flex flex-col gap-6 lg:col-span-2">
                {status !== "success" ? (
                  <GlassCard className="flex flex-col gap-6">
                    <h2 className="font-display text-lg font-bold text-white">Lock XLM & Create Claim Link</h2>

                    <form onSubmit={handleLockFunds} className="flex flex-col gap-6">
                      <div className="flex flex-col gap-2">
                        <label htmlFor="amount" className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Lock Amount (XLM)
                        </label>
                        <div className="rounded-xl border border-white/15 bg-black/40 focus-within:border-blue-500">
                          <input
                            id="amount"
                            type="number"
                            step="0.0000001"
                            min="0.0000001"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            disabled={busy}
                            className={inputClass}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label htmlFor="secret" className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Claim Secret
                        </label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <div className="flex-1 rounded-xl border border-white/15 bg-black/40 focus-within:border-blue-500">
                            <input
                              id="secret"
                              type="text"
                              placeholder="Enter or generate secret"
                              value={secret}
                              onChange={(e) => handleSecretChange(e.target.value)}
                              disabled={busy}
                              className={inputClass}
                              required
                            />
                          </div>
                          <Button type="button" variant="outline" size="md" onClick={generateRandomSecret} disabled={busy}>
                            <KeyRound className="h-4 w-4" />
                            Generate
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label htmlFor="duration" className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Time-Lock Duration
                        </label>
                        <div className="rounded-xl border border-white/15 bg-black/40 focus-within:border-blue-500">
                          <select
                            id="duration"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            disabled={busy}
                            className={cn(inputClass, "cursor-pointer")}
                          >
                            <option value={720} className="bg-black">1 Hour (720 ledgers)</option>
                            <option value={4320} className="bg-black">6 Hours (4,320 ledgers)</option>
                            <option value={17280} className="bg-black">24 Hours (17,280 ledgers)</option>
                            <option value={120960} className="bg-black">7 Days (120,960 ledgers)</option>
                          </select>
                        </div>
                      </div>

                      {status === "error" && (
                        <div className="flex items-start gap-3 rounded-xl border border-red-500/35 bg-red-950/30 p-4 text-sm text-red-300">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          {errorMsg}
                        </div>
                      )}
                      {status === "building" && (
                        <div className="flex items-center gap-3 rounded-xl border border-blue-500/25 bg-blue-500/10 p-4 text-sm text-blue-300">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Building transaction…
                        </div>
                      )}
                      {status === "signing" && (
                        <div className="flex items-center gap-3 rounded-xl border border-blue-500/25 bg-blue-500/10 p-4 text-sm text-blue-300">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Awaiting Freighter signature…
                        </div>
                      )}
                      {status === "submitting" && (
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-950/30 p-4 text-sm text-emerald-300">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting to network…
                        </div>
                      )}

                      <Button type="submit" variant="primary" size="lg" fullWidth disabled={busy}>
                        {busy ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                        ) : (
                          <><Lock className="h-4 w-4" /> Lock XLM in Escrow</>
                        )}
                      </Button>
                    </form>
                  </GlassCard>
                ) : (
                  <GlassCard className="flex flex-col items-center gap-6 py-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                      <Check className="h-8 w-8 text-emerald-400" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <h2 className="font-display text-xl font-bold text-white">XLM Locked Successfully!</h2>
                      <p className="text-sm text-slate-400">Share this claim link with your recipient.</p>
                    </div>
                    <div className="w-full rounded-xl border border-white/15 bg-black/40">
                      <input type="text" readOnly value={claimLink} className={cn(inputClass, "text-xs")} />
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button variant="primary" size="sm" onClick={copyLink}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied!" : "Copy Link"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={resetForm}>
                        Deploy Another
                      </Button>
                    </div>
                    {txHash && (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
                      >
                        View transaction <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </GlassCard>
                )}
              </div>

              {/* Sidebar */}
              <div className="flex flex-col gap-6">
                <GlassCard className="flex flex-col gap-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Wallet</p>
                  <p className="break-all font-mono text-xs text-slate-300">{walletAddress}</p>
                  <div className="h-px bg-white/10" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">XLM Balance</p>
                      <p className="font-display text-2xl font-bold text-white">
                        {loadingBalance ? "…" : xlmBalance}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBalanceRefetch((n) => n + 1)}
                      disabled={loadingBalance}
                    >
                      <RefreshCw className={cn("h-4 w-4", loadingBalance && "animate-spin")} />
                    </Button>
                  </div>
                </GlassCard>

                <GlassCard className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-400" />
                    <p className="font-display text-sm font-bold text-white">Testnet Faucet</p>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">
                    Need testnet XLM? Fund your wallet via Friendbot — no trustline required.
                  </p>
                  <div className="flex flex-col gap-2">
                    <a
                      href={`https://friendbot.stellar.org?addr=${walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/20 text-xs font-medium text-white no-underline hover:border-blue-500/50 hover:bg-blue-500/10"
                    >
                      Fund XLM via Friendbot <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}
        </PageContainer>
      </main>
    </PageShell>
  );
}
