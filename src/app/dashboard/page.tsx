"use client";

import { useState, useEffect } from "react";
import {
  Lock,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Wallet,
  Droplets,
  Loader2,
  AlertCircle,
  Shield,
  CheckCircle,
  Fingerprint,
  Cpu,
  Terminal,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useWallet } from "@/context/WalletContext";
import { getXlmBalance, buildLockFundsTx, submitSignedTx } from "@/lib/stellar-client";
import { Button } from "@/components/ui/button";
import { GlassCard, PageShell, PageContainer } from "@/components/ui/layout";
import { cn } from "@/lib/utils";
import { Contract, Address, rpc as StellarRpc, TransactionBuilder } from "@stellar/stellar-sdk";

const DURATION_OPTIONS = [
  { label: "1 Hour", ledgers: 720 },
  { label: "6 Hours", ledgers: 4320 },
  { label: "24 Hours", ledgers: 17280 },
  { label: "7 Days", ledgers: 120960 },
];

type TxStatus = "idle" | "building" | "signing" | "submitting" | "success" | "error";

const checkIsVerifiedHuman = async (address: string): Promise<boolean> => {
  try {
    const serverUrl = process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
    const server = new StellarRpc.Server(serverUrl);
    const envPodId = (process.env.NEXT_PUBLIC_POD_REGISTRY_CONTRACT_ID || "").trim();
    const podContractId = envPodId.startsWith("C") && envPodId.length === 56
      ? envPodId
      : "CCCT6ZJ3HN3Y46NNRU2NBJGX77HXGHJXO6FU3TYIGCX3PSRSYRVRGWDE";
    
    const contract = new Contract(podContractId);
    const op = contract.call("is_verified_human", new Address(address).toScVal());
    
    const account = await server.getAccount(address);
    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: "Test SDF Network ; September 2015",
    })
      .addOperation(op)
      .setTimeout(30)
      .build();
      
    const sim = await server.simulateTransaction(tx);
    if (StellarRpc.Api.isSimulationError(sim)) {
      return false;
    }
    
    const resultVal = (sim as StellarRpc.Api.SimulateTransactionSuccessResponse).result?.retval;
    if (resultVal) {
      return resultVal.b();
    }
    return false;
  } catch (e) {
    console.error("Error checking verification status", e);
    return false;
  }
};

export default function DashboardPage() {
  const { walletAddress, connecting, connectionError, connectWallet } = useWallet();
  const [xlmBalance, setXlmBalance] = useState("0");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [amount, setAmount] = useState("");
  const [secret, setSecret] = useState("");

  const [podStatus, setPodStatus] = useState<"idle" | "loading" | "verified" | "unregistered" | "registering" | "error">("idle");
  const [, setPodKey] = useState("");
  const [podScore, setPodScore] = useState("0%");
  const [, setPodTxHash] = useState("");

  const [duration, setDuration] = useState(17280);
  const [status, setStatus] = useState<TxStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [txHash, setTxHash] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [balanceRefetch, setBalanceRefetch] = useState(0);

  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [SYSTEM] Biometric Escrow Console initialized.`,
  ]);

  const handleDurationChange = (val: number, label: string) => {
    setDuration(val);
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] [CONFIG] Expiration duration set to: ${label}`,
      ...prev,
    ]);
  };

  useEffect(() => {
    if (!walletAddress) {
      queueMicrotask(() => setPodStatus("idle"));
      return;
    }

    const checkPod = async () => {
      setPodStatus("loading");
      const isVerified = await checkIsVerifiedHuman(walletAddress);
      if (isVerified) {
        setPodStatus("verified");
        setPodScore("100%");
        const storedKey = localStorage.getItem(`pod_key_${walletAddress}`);
        if (storedKey) setPodKey(storedKey);
      } else {
        setPodStatus("unregistered");
        setPodScore("0%");
      }
    };
    
    checkPod();
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress) return;
    let active = true;

    const load = async () => {
      setLoadingBalance(true);
      try {
        const bal = await getXlmBalance(walletAddress);
        if (active) {
          setXlmBalance(bal);
        }
      } catch (err) {
        console.error("Failed to load XLM balance", err);
      } finally {
        if (active) setLoadingBalance(false);
      }
    };

    load();
    return () => { active = false; };
  }, [walletAddress, balanceRefetch]);

  const startPoDRegistration = async () => {
    if (!walletAddress) return;
    setPodStatus("registering");
    
    try {
      const challengeRes = await fetch(`/api/pod/challenge?userAddress=${walletAddress}`);
      if (!challengeRes.ok) throw new Error("Failed to fetch challenge.");
      const challengeOptions = await challengeRes.json();
      
      const { startRegistration, startAuthentication } = await import("@simplewebauthn/browser");
      
      const regResponse = await startRegistration({
        optionsJSON: challengeOptions,
      });
      
      const assertResponse = await startAuthentication({
        optionsJSON: {
          challenge: challengeOptions.challenge,
          rpId: challengeOptions.rp.id,
          allowCredentials: [{
            id: regResponse.id,
            type: "public-key",
            transports: (regResponse.response.transports ?? ["internal"]) as ("internal" | "usb" | "nfc" | "ble" | "hybrid")[],
          }],
          userVerification: "required",
          timeout: 60000,
        }
      });
      
      const buildRes = await fetch("/api/pod/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "build",
          userAddress: walletAddress,
          registrationResponse: regResponse,
          assertionResponse: assertResponse,
        }),
      });
      
      if (!buildRes.ok) {
        const errData = await buildRes.json();
        throw new Error(errData.error || "Failed to build transaction.");
      }
      
      const { unsignedXdr, publicKeyHex } = await buildRes.json();
      
      const { signTransaction } = await import("@stellar/freighter-api");
      const signedRes = await signTransaction(unsignedXdr, {
        networkPassphrase: "Test SDF Network ; September 2015",
      });
      
      if (!signedRes || signedRes.error) {
        throw new Error(signedRes?.error || "Freighter signature rejected.");
      }
      
      const submitRes = await fetch("/api/pod/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          signedXdr: signedRes.signedTxXdr,
        }),
      });
      
      if (!submitRes.ok) {
        const errData = await submitRes.json();
        throw new Error(errData.error || "Failed to submit transaction.");
      }
      
      const { txHash } = await submitRes.json();
      
      setPodTxHash(txHash);
      setPodKey(publicKeyHex);
      localStorage.setItem(`pod_key_${walletAddress}`, publicKeyHex);
      setPodStatus("verified");
      setPodScore("100%");
      
    } catch (error: unknown) {
      console.error(error);
      setPodStatus("error");
    }
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (status === "error") { setStatus("idle"); setErrorMsg(""); }
  };

  const handleSecretChange = (val: string) => {
    setSecret(val);
    if (status === "error") { setStatus("idle"); setErrorMsg(""); }
  };

  const generateRandomSecret = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const newSecret = Array.from(array, (b) => chars.charAt(b % chars.length)).join("");
    setSecret(newSecret);
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
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const claimLink = typeof window !== "undefined"
    ? `${window.location.origin}/claim?secret=${encodeURIComponent(secret)}`
    : "";

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(claimLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const resetForm = () => {
    setAmount("");
    setSecret("");
    setTxHash("");
    setStatus("idle");
  };

  const busy = status !== "idle" && status !== "error";

  const inputClass =
    "w-full bg-slate-50 px-4 py-3.5 text-sm font-sans text-[#0a0f1d] font-semibold outline-none rounded-xl border border-slate-200/80 focus:border-[#15349e] focus:bg-white transition-all placeholder:text-slate-400 shadow-sm";

  return (
    <PageShell>
      <Navbar />

      <main className="flex-1 pb-24 pt-8 sm:pt-12 font-sans">
        <PageContainer className="flex flex-col gap-10">
          
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="flex flex-col gap-1.5 min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0a0f1d]">
                Biometric Escrow Console
              </h1>
            </div>
          </div>

          {!walletAddress ? (
            <GlassCard className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 px-8 text-center border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)] rounded-3xl">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#15349e]/10 text-[#15349e] border border-[#15349e]/20 shadow-[0_0_25px_rgba(21,52,158,0.15)]">
                <Wallet className="h-8 w-8" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="font-display text-2xl font-extrabold text-[#0a0f1d]">Wallet Connection Required</h2>
                <p className="text-sm text-slate-500 leading-relaxed font-normal">
                  Connect your wallet to access the console, attest device biometrics, and lock non-custodial XLM escrow vaults.
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={connectWallet}
                disabled={connecting}
                className="font-sans font-bold uppercase tracking-wide text-xs shadow-[0_4px_20px_rgba(21,52,158,0.25)] rounded-full py-4"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-white" />
                    Connecting Wallet...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2 text-white" />
                    Connect Wallet
                  </>
                )}
              </Button>
              {connectionError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-600 w-full text-left">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>{connectionError}</span>
                </div>
              )}
            </GlassCard>
          ) : (
            /* ══════════════════════════════════════════════════
                CLEAN DASHBOARD WORKSPACE
            ═════════════════════════════════════════════════ */
            <div className="flex flex-col gap-10">
              
              {/* Top Stats Ribbon (3 Equal White Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: Connected Anchor */}
                <GlassCard className="border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">
                      Connected Anchor
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#15349e] bg-[#15349e]/10 px-2.5 py-0.5 rounded-full border border-[#15349e]/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#15349e] animate-pulse" />
                      ACTIVE
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">STELLAR ACCOUNT</span>
                    <div className="flex items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60 min-w-0">
                      <span className="font-mono text-xs font-bold text-[#0a0f1d] truncate min-w-0">{walletAddress}</span>
                      <button
                        type="button"
                        onClick={copyAddress}
                        className="p-1 text-slate-400 hover:text-[#15349e] hover:bg-slate-200 rounded-md transition-colors shrink-0"
                        title="Copy Address"
                      >
                        {copiedAddress ? <Check className="h-3.5 w-3.5 text-[#15349e]" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </GlassCard>

                {/* Card 2: Native Balance */}
                <GlassCard className="border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">
                      Available Balance
                    </span>
                    <button
                      type="button"
                      onClick={() => setBalanceRefetch((n) => n + 1)}
                      disabled={loadingBalance}
                      className="text-slate-400 hover:text-[#15349e] transition-colors cursor-pointer"
                      title="Refresh Balance"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", loadingBalance && "animate-spin")} />
                    </button>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">NATIVE ASSET</span>
                    <div className="flex items-baseline justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <span className="text-2xl font-extrabold text-[#0a0f1d] font-display">
                        {loadingBalance ? "..." : xlmBalance}
                      </span>
                      <span className="text-xs font-bold text-[#15349e]">XLM</span>
                    </div>
                  </div>
                </GlassCard>

                {/* Card 3: Testnet Faucet */}
                <GlassCard className="border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">
                      Testnet Faucet
                    </span>
                    <Droplets className="h-4 w-4 text-[#15349e]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">INSTANT FUNDING</span>
                    <a
                      href={`https://friendbot.stellar.org?addr=${walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-[#0a0f1d] hover:border-[#15349e] hover:bg-[#15349e]/5 hover:text-[#15349e] transition-all uppercase tracking-wide shadow-sm"
                    >
                      <span>Fund via Friendbot</span>
                      <ExternalLink className="h-3.5 w-3.5 text-[#15349e]" />
                    </a>
                  </div>
                </GlassCard>

              </div>

              {/* Main 2-Column Split: Identity (5 cols) & Escrow Vault (7 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Identity Status Card (5 columns) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <GlassCard className="flex flex-col gap-6 border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#15349e]/10 text-[#15349e] border border-[#15349e]/20">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="font-display text-lg font-extrabold text-[#0a0f1d] tracking-tight">
                            Identity Status
                          </h2>
                          <p className="text-xs text-slate-500">
                            Hardware attestation
                          </p>
                        </div>
                      </div>

                      <div>
                        {podStatus === "verified" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#15349e]/10 px-3 py-1 text-[11px] font-bold text-[#15349e] border border-[#15349e]/20">
                            <CheckCircle className="h-3.5 w-3.5" />
                            VERIFIED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 border border-slate-200">
                            <Fingerprint className="h-3.5 w-3.5" />
                            UNVERIFIED
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-6">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border",
                          podStatus === "verified"
                            ? "border-[#15349e]/30 bg-[#15349e]/10 text-[#15349e] shadow-sm"
                            : "border-slate-200 bg-white text-slate-500 shadow-sm"
                        )}>
                          {podStatus === "verified" ? <Cpu className="h-6 w-6" /> : <Fingerprint className="h-6 w-6" />}
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ATTESTATION STATE</span>
                          <p className={cn(
                            "text-sm font-bold tracking-tight",
                            podStatus === "verified" ? "text-[#15349e]" : "text-[#0a0f1d]"
                          )}>
                            {podStatus === "verified"
                              ? "Hardware-Attested Human"
                              : "Unverified Account"}
                          </p>
                          <p className="text-xs text-slate-500 leading-relaxed font-normal">
                            {podStatus === "verified"
                              ? `secp256r1 Enclave Key bound. Sybil Score: ${podScore}`
                              : "Bind your device's hardware Secure Enclave to claim zero-gas settlement privileges."}
                          </p>
                        </div>
                      </div>

                      {podStatus !== "verified" && (
                        <div className="pt-2">
                          <Button
                            variant="primary"
                            size="md"
                            fullWidth
                            onClick={startPoDRegistration}
                            disabled={podStatus === "registering" || podStatus === "loading"}
                            className="font-sans text-xs font-bold uppercase tracking-wide shadow-[0_4px_15px_rgba(21,52,158,0.25)] rounded-full py-3.5"
                          >
                            {podStatus === "registering" ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2 text-white" />
                                Enabling Biometrics...
                              </>
                            ) : (
                              <>
                                <Fingerprint className="h-4 w-4 mr-2 text-white" />
                                Enable Biometric Identity
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </div>

                {/* Escrow Vault Card (7 columns) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {status !== "success" ? (
                    <GlassCard className="flex flex-col gap-6 border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#15349e]/10 text-[#15349e] border border-[#15349e]/20">
                          <Lock className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="font-display text-lg font-extrabold text-[#0a0f1d] tracking-tight">
                            Escrow Vault
                          </h2>
                          <p className="text-xs text-slate-500 font-sans">
                            Lock native XLM and generate an instant biometric claim link
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleLockFunds} className="flex flex-col gap-6">
                        
                        {/* Lock Amount */}
                        <div className="flex flex-col gap-2">
                          <label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex flex-wrap justify-between gap-1">
                            <span>Lock Amount (XLM)</span>
                            <span className="text-xs text-slate-500 font-semibold">Available: {xlmBalance} XLM</span>
                          </label>
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

                        {/* Claim Secret */}
                        <div className="flex flex-col gap-2">
                          <label htmlFor="secret" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Claim Secret Key
                          </label>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              id="secret"
                              type="text"
                              placeholder="Enter or generate 128-bit secret"
                              value={secret}
                              onChange={(e) => handleSecretChange(e.target.value)}
                              disabled={busy}
                              className={inputClass}
                              required
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="md"
                              onClick={generateRandomSecret}
                              disabled={busy}
                              className="shrink-0 font-sans text-xs font-bold uppercase tracking-wide border-slate-200 hover:border-[#15349e] rounded-xl text-slate-700 py-3.5"
                            >
                              <KeyRound className="h-4 w-4 mr-1.5 text-[#15349e]" />
                              Generate
                            </Button>
                          </div>
                        </div>

                        {/* Time-Lock Duration (Segmented Controls) */}
                        <div className="flex flex-col gap-2.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Time-Lock Duration
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-100/80 border border-slate-200/80 rounded-2xl">
                            {DURATION_OPTIONS.map((opt) => {
                              const isActive = duration === opt.ledgers;
                              return (
                                <button
                                  key={opt.ledgers}
                                  type="button"
                                  onClick={() => handleDurationChange(opt.ledgers, opt.label)}
                                  disabled={busy}
                                  className={cn(
                                    "flex items-center justify-center py-3 px-3 rounded-xl text-xs font-bold font-sans transition-all duration-200 cursor-pointer select-none",
                                    isActive
                                      ? "bg-[#15349e] text-white shadow-[0_4px_12px_rgba(21,52,158,0.3)] scale-[1.02]"
                                      : "bg-transparent text-slate-600 hover:text-[#0a0f1d] hover:bg-white/60"
                                  )}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Status Messages */}
                        {status === "error" && (
                          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-600">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                            <span>{errorMsg}</span>
                          </div>
                        )}
                        {status === "building" && (
                          <div className="flex items-center gap-3 rounded-xl border border-[#15349e]/20 bg-[#15349e]/5 p-4 text-xs font-bold text-[#15349e]">
                            <Loader2 className="h-4 w-4 animate-spin text-[#15349e]" />
                            <span>Building time-locked Soroban escrow transaction...</span>
                          </div>
                        )}
                        {status === "signing" && (
                          <div className="flex items-center gap-3 rounded-xl border border-[#15349e]/20 bg-[#15349e]/5 p-4 text-xs font-bold text-[#15349e]">
                            <Loader2 className="h-4 w-4 animate-spin text-[#15349e]" />
                            <span>Requesting Freighter wallet signature...</span>
                          </div>
                        )}
                        {status === "submitting" && (
                          <div className="flex items-center gap-3 rounded-xl border border-[#15349e]/20 bg-[#15349e]/5 p-4 text-xs font-bold text-[#15349e]">
                            <Loader2 className="h-4 w-4 animate-spin text-[#15349e]" />
                            <span>Broadcasting signed transaction to Soroban testnet...</span>
                          </div>
                        )}

                        {/* Action Button */}
                        <Button
                          type="submit"
                          variant="primary"
                          size="lg"
                          fullWidth
                          disabled={busy}
                          className="font-sans text-xs font-bold tracking-wide uppercase mt-2 shadow-[0_4px_20px_rgba(21,52,158,0.25)] rounded-full py-4"
                        >
                          {busy ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2 text-white" />
                              Locking Funds...
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-2 text-white" />
                              Lock Funds Securely
                            </>
                          )}
                        </Button>
                      </form>
                    </GlassCard>
                  ) : (
                    <GlassCard className="flex flex-col items-center gap-6 py-12 px-8 text-center border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#15349e]/10 text-[#15349e] border border-[#15349e]/20 shadow-[0_0_25px_rgba(21,52,158,0.15)]">
                        <Check className="h-8 w-8 text-[#15349e]" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <h2 className="font-display text-2xl font-extrabold text-[#0a0f1d] tracking-tight">
                          Vault Sealed &amp; Funds Ready!
                        </h2>
                        <p className="text-sm text-slate-500 max-w-md font-normal">
                          Share this cryptographic claim link with your recipient. Settlement requires zero gas fees from the claimer.
                        </p>
                      </div>
                      
                      <div className="w-full rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-left font-mono">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1.5">CLAIM LINK (SECRET)</span>
                        <input type="text" readOnly value={claimLink} className="w-full bg-transparent text-xs text-[#15349e] font-bold font-mono outline-none" />
                      </div>

                      <div className="flex flex-wrap justify-center gap-4 w-full font-sans">
                        <Button variant="primary" size="md" onClick={copyLink} className="text-xs font-bold uppercase tracking-wide shadow-[0_4px_20px_rgba(21,52,158,0.25)] rounded-full px-6 py-3.5">
                          {copiedLink ? <Check className="h-4 w-4 mr-1.5 text-white" /> : <Copy className="h-4 w-4 mr-1.5 text-white" />}
                          {copiedLink ? "Copied to Clipboard" : "Copy Claim Link"}
                        </Button>
                        <Button variant="outline" size="md" onClick={resetForm} className="text-xs font-bold uppercase tracking-wide border-slate-200 hover:border-[#15349e] rounded-full px-6 py-3.5 text-slate-700">
                          Lock Another Vault
                        </Button>
                      </div>

                      {txHash && (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-bold text-[#15349e] hover:underline pt-2 font-mono"
                        >
                          <span>View on Stellar.Expert Explorer</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </GlassCard>
                  )}

                  {/* Terminal Logger Feedback Widget */}
                  <GlassCard className="flex flex-col gap-3 border-slate-200/80 bg-[#0a0f1d] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl text-white font-mono">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5 text-xs">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <Terminal className="h-4 w-4" />
                        <span>SYSTEM ACTIVITY CONSOLE</span>
                      </div>
                      <span className="text-[10px] text-slate-400">SOROBAN TESTNET</span>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto text-xs text-slate-300 font-mono scrollbar-thin">
                      {logs.length === 0 ? (
                        <span className="text-slate-500 italic">No system events logged yet...</span>
                      ) : (
                        logs.map((log, index) => (
                          <div key={index} className="flex items-start gap-2 min-w-0">
                            <span className="text-emerald-400 font-bold shrink-0">❯</span>
                            <span className="break-all min-w-0">{log}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </GlassCard>
                </div>

              </div>
            </div>
          )}
        </PageContainer>
      </main>

      <Footer />
    </PageShell>
  );
}
