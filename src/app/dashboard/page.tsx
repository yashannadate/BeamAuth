"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useWallet } from "@/context/WalletContext";
import { getUsdcBalance, buildLockFundsTx, submitSignedTx } from "@/lib/stellar-client";

type TxStatus = "idle" | "building" | "signing" | "submitting" | "success" | "error";

export default function DashboardPage() {
  const { walletAddress, connecting, connectWallet } = useWallet();
  const [usdcBalance, setUsdcBalance] = useState<string>("0.00");
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Form State
  const [amount, setAmount] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [duration, setDuration] = useState<number>(17280); // 24 hours in ledgers

  // Transaction submission state
  const [status, setStatus] = useState<TxStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Fetch USDC balance when wallet changes
  const fetchBalance = async () => {
    if (!walletAddress) return;
    setLoadingBalance(true);
    const bal = await getUsdcBalance(walletAddress);
    setUsdcBalance(bal);
    setLoadingBalance(false);
  };

  useEffect(() => {
    fetchBalance();
  }, [walletAddress]);

  const generateRandomSecret = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    let result = "";
    for (let i = 0; i < array.length; i++) {
      result += chars.charAt(array[i] % chars.length);
    }
    setSecret(result);
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

      // 1. Build and prepare transaction XDR
      const xdr = await buildLockFundsTx(walletAddress, secret, amount, duration);

      // 2. Request Freighter signature
      setStatus("signing");
      const { signTransaction } = await import("@stellar/freighter-api");
      const signedRes = await signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });

      if (!signedRes || signedRes.error) {
        throw new Error(signedRes?.error || "Freighter signature rejected by user.");
      }

      const signedXdr = signedRes.signedTxXdr;

      // 3. Broadcast transaction and poll for completion
      setStatus("submitting");
      const hash = await submitSignedTx(signedXdr);
      setTxHash(hash);
      setStatus("success");
      
      // Update USDC balance after locking funds
      fetchBalance();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred while locking funds.");
      setStatus("error");
    }
  };

  const getClaimLink = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/claim?secret=${encodeURIComponent(secret)}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getClaimLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setAmount("");
    setSecret("");
    setTxHash("");
    setStatus("idle");
  };

  return (
    <main className="min-h-screen bg-beam-black relative" id="dashboard-page">
      <Navbar />

      {/* Ambient background glow */}
      <div
        className="glow-orb glow-orb-blue absolute"
        style={{ width: 500, height: 500, top: "20%", right: "-10%", opacity: 0.2 }}
        aria-hidden="true"
      />
      <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true" />

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20 relative z-10">
        
        {/* Header */}
        <div className="mb-12">
          <span className="feature-badge mb-4 inline-block">Portal</span>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            Lock Funds &amp; Generate Link
          </h1>
          <p className="text-beam-muted text-lg max-w-xl">
            Lock USDC into the Soroban Escrow contract. You will receive a unique link. 
            Anyone with the link can claim the funds using their Face ID.
          </p>
        </div>

        {/* ── DISCONNECTED STATE ── */}
        {!walletAddress ? (
          <div className="glass-card rounded-3xl p-12 text-center animate-fade-up">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-blue-400" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-3">Connect your Wallet</h2>
            <p className="text-beam-muted mb-8 max-w-md mx-auto text-sm">
              Please connect your Freighter browser extension to load your USDC balance and lock funds.
            </p>
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="btn-primary"
              id="dashboard-connect-wallet"
            >
              {connecting ? "Connecting Freighter..." : "Connect Freighter Wallet"}
            </button>
          </div>
        ) : (
          /* ── CONNECTED STATE ── */
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Form Column */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Form Card */}
              {status !== "success" ? (
                <div className="glass-card rounded-3xl p-8 animate-fade-up">
                  <form onSubmit={handleLockFunds} className="space-y-6">
                    
                    {/* Amount Input */}
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-beam-muted mb-2">
                        Amount to Lock (USDC)
                      </label>
                      <div className="relative rounded-xl border border-beam-border bg-white/[0.02] focus-within:border-blue-500/50 transition-colors duration-300">
                        <input
                          id="amount"
                          type="number"
                          step="0.0000001"
                          min="0.0000001"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          disabled={status !== "idle" && status !== "error"}
                          className="block w-full bg-transparent border-0 px-4 py-3 text-white placeholder-white/20 focus:ring-0 focus:outline-none text-lg font-semibold"
                          required
                        />
                        <div className="absolute inset-y-0 right-4 flex items-center gap-2 pointer-events-none">
                          <span className="text-sm font-bold text-blue-400">USDC</span>
                        </div>
                      </div>
                    </div>

                    {/* Secret Input */}
                    <div>
                      <label htmlFor="secret" className="block text-sm font-medium text-beam-muted mb-2">
                        Secret Key (Pre-image)
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1 rounded-xl border border-beam-border bg-white/[0.02] focus-within:border-blue-500/50 transition-colors duration-300">
                          <input
                            id="secret"
                            type="text"
                            placeholder="Enter or generate secret"
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            disabled={status !== "idle" && status !== "error"}
                            className="block w-full bg-transparent border-0 px-4 py-3 text-white placeholder-white/20 focus:ring-0 focus:outline-none font-mono text-sm"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={generateRandomSecret}
                          disabled={status !== "idle" && status !== "error"}
                          className="btn-outline py-3 px-4 text-xs font-semibold"
                        >
                          Auto-Generate
                        </button>
                      </div>
                    </div>

                    {/* Expiration Dropdown */}
                    <div>
                      <label htmlFor="duration" className="block text-sm font-medium text-beam-muted mb-2">
                        Link Expiration
                      </label>
                      <select
                        id="duration"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        disabled={status !== "idle" && status !== "error"}
                        className="block w-full rounded-xl border border-beam-border bg-beam-black/80 px-4 py-3 text-white focus:border-blue-500/50 focus:ring-0 focus:outline-none text-sm"
                      >
                        <option value={720}>1 Hour (Short Escrow)</option>
                        <option value={4320}>6 Hours</option>
                        <option value={17280}>24 Hours (Standard)</option>
                        <option value={120960}>7 Days (Long Escrow)</option>
                      </select>
                    </div>

                    {/* Status Alert Messages */}
                    {status === "error" && (
                      <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 text-xs leading-relaxed">
                        <strong>Error:</strong> {errorMsg}
                      </div>
                    )}

                    {status === "building" && (
                      <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-3">
                        <span className="spinner w-4 h-4" />
                        <span>Simulating transaction and generating footprints...</span>
                      </div>
                    )}

                    {status === "signing" && (
                      <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-3">
                        <span className="spinner w-4 h-4" />
                        <span>Please sign the transaction request in your Freighter popup...</span>
                      </div>
                    )}

                    {status === "submitting" && (
                      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-3">
                        <span className="spinner w-4 h-4" />
                        <span>Broadcasting to Stellar Testnet and polling for ledger confirmation...</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={status !== "idle" && status !== "error"}
                      className="btn-mega disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {status === "idle" || status === "error" ? (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Lock Funds &amp; Generate Link
                        </>
                      ) : (
                        "Processing..."
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                
                /* ── SUCCESS STATE CARD ── */
                <div className="glass-card rounded-3xl p-8 sm:p-10 text-center animate-fade-up border-emerald-500/20">
                  <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-emerald-400">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-white mb-2">Escrow Confirmed! 🎉</h2>
                  <p className="text-sm text-beam-muted mb-6">
                    USDC locked successfully. Send the link below to your recipient.
                  </p>

                  <div className="beam-divider mb-6" />

                  {/* Shareable Link Box */}
                  <div className="bg-white/[0.03] border border-beam-border rounded-xl p-4 mb-4 text-left">
                    <label className="block text-xs font-bold text-beam-muted uppercase tracking-wider mb-2">
                      Secure Claim Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getClaimLink()}
                        className="bg-transparent border-0 w-full font-mono text-xs text-blue-300 focus:ring-0 focus:outline-none py-1"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="btn-outline text-xs px-3 py-1 font-semibold whitespace-nowrap"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Escrow Details */}
                  <div className="grid grid-cols-2 gap-4 text-left text-xs bg-white/[0.02] border border-beam-border/40 rounded-xl p-4 mb-8">
                    <div>
                      <span className="text-beam-muted block">Locked Amount</span>
                      <span className="text-white font-semibold font-mono text-sm">{amount} USDC</span>
                    </div>
                    <div>
                      <span className="text-beam-muted block">Secret (Keep Private)</span>
                      <span className="text-white font-semibold font-mono">{secret}</span>
                    </div>
                    <div className="col-span-2 border-t border-beam-border/30 pt-2 mt-2">
                      <span className="text-beam-muted block">Transaction Hash</span>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline font-mono break-all text-[11px]"
                      >
                        {txHash} ↗
                      </a>
                    </div>
                  </div>

                  <button onClick={resetForm} className="btn-primary w-full">
                    Create Another Link
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              
              {/* Account Balance Card */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-xs font-bold text-beam-muted uppercase tracking-wider mb-4">
                  Stellar Wallet
                </h3>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-lg">
                    🔑
                  </div>
                  <div>
                    <span className="text-white font-semibold block text-sm font-mono">
                      {walletAddress.slice(0, 6)}…{walletAddress.slice(-6)}
                    </span>
                    <span className="text-xs text-beam-muted uppercase">Freighter Account</span>
                  </div>
                </div>

                <div className="beam-divider mb-4" />

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-beam-muted uppercase tracking-wider block">
                      USDC Balance
                    </span>
                    <span className="text-xl font-bold font-mono text-white">
                      {loadingBalance ? "..." : usdcBalance}
                    </span>
                  </div>
                  <button
                    onClick={fetchBalance}
                    disabled={loadingBalance}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200"
                    title="Refresh Balance"
                  >
                    <svg className={`w-4 h-4 text-beam-muted ${loadingBalance && "animate-spin"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Guide Card */}
              <div className="glass-card rounded-2xl p-6 bg-blue-950/10 border-blue-500/10">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">
                  Need Testnet Tokens?
                </h3>
                <p className="text-xs text-beam-muted leading-relaxed mb-4">
                  To complete transactions on Stellar Testnet, you need XLM for gas fees and USDC to escrow.
                </p>
                <div className="space-y-2">
                  <a
                    href={`https://friendbot.stellar.org?addr=${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-center text-xs py-2 block w-full"
                  >
                    Get Testnet XLM (Friendbot) ↗
                  </a>
                  <a
                    href="https://laboratory.stellar.org/#txcreator?network=test"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-center text-xs py-2 block w-full"
                  >
                    Mint Testnet USDC ↗
                  </a>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}
