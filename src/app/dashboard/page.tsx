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
  Shield,
  CheckCircle,
  Fingerprint,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useWallet } from "@/context/WalletContext";
import { getXlmBalance, buildLockFundsTx, submitSignedTx } from "@/lib/stellar-client";
import { Button } from "@/components/ui/button";
import { GlassCard, PageShell, PageContainer } from "@/components/ui/layout";
import { cn } from "@/lib/utils";
import { Contract, Address, rpc as StellarRpc, TransactionBuilder } from "@stellar/stellar-sdk";

type TxStatus = "idle" | "building" | "signing" | "submitting" | "success" | "error";

const checkIsVerifiedHuman = async (address: string): Promise<boolean> => {
  try {
    const serverUrl = process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
    const server = new StellarRpc.Server(serverUrl);
    const podContractId = process.env.NEXT_PUBLIC_POD_REGISTRY_CONTRACT_ID ?? "";
    if (!podContractId) return false;
    
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
    
    const resultVal = (sim as any).result?.retval;
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
  const [podLogs, setPodLogs] = useState<string[]>([]);
  const [podKey, setPodKey] = useState("");
  const [podScore, setPodScore] = useState("0%");
  const [podTxHash, setPodTxHash] = useState("");

  useEffect(() => {
    if (!walletAddress) {
      setPodStatus("idle");
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

  const startPoDRegistration = async () => {
    if (!walletAddress) return;
    setPodStatus("registering");
    setPodLogs([]);
    
    const addLog = (msg: string) => {
      setPodLogs((prev) => [...prev, msg]);
    };
    
    try {
      addLog("[INFO] Establishing secure cryptographic runtime loop...");
      await new Promise((r) => setTimeout(r, 800));
      
      addLog("[PENDING] Requesting registration challenge from secure relayer anchor...");
      const challengeRes = await fetch(`/api/pod/challenge?userAddress=${walletAddress}`);
      if (!challengeRes.ok) throw new Error("Failed to fetch challenge.");
      const challengeOptions = await challengeRes.json();
      await new Promise((r) => setTimeout(r, 600));
      
      addLog("[INFO] Launching WebAuthn Secure Enclave Ceremony...");
      const { startRegistration, startAuthentication } = await import("@simplewebauthn/browser");
      
            const regResponse = await startRegistration({
        optionsJSON: challengeOptions,
      });
      addLog("[OK] Biometric credentials created.");
      await new Promise((r) => setTimeout(r, 600));
      
      addLog("[PENDING] Performing possession proof signing ceremony...");
      const assertResponse = await startAuthentication({
        optionsJSON: {
          challenge: challengeOptions.challenge,
          rpId: challengeOptions.rp.id,
          allowCredentials: [{
            id: regResponse.id,
            type: "public-key",
            transports: (regResponse.response.transports ?? ["internal"]) as any,
          }],
          userVerification: "required",
          timeout: 60000,
        }
      });
      addLog("[OK] Biometric ceremony approved by local Secure Enclave.");
      await new Promise((r) => setTimeout(r, 800));
      
      addLog("[PENDING] Conveying payloads to relayer for fee-bump simulation...");
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
      await new Promise((r) => setTimeout(r, 600));
      
      addLog("[PENDING] Sponsoring transaction. Requesting Freighter validation...");
      const { signTransaction } = await import("@stellar/freighter-api");
      const signedRes = await signTransaction(unsignedXdr, {
        networkPassphrase: "Test SDF Network ; September 2015",
      });
      
      if (!signedRes || signedRes.error) {
        throw new Error(signedRes?.error || "Freighter signature rejected.");
      }
      
      addLog("[PENDING] Committing sponsored transaction to Testnet ledger...");
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
      addLog(`[SUCCESS] Fee-bumped transaction committed to ledger. Hash: 0x${txHash.slice(0, 16)}...`);
      
      setPodTxHash(txHash);
      setPodKey(publicKeyHex);
      localStorage.setItem(`pod_key_${walletAddress}`, publicKeyHex);
      setPodStatus("verified");
      setPodScore("100%");
      
    } catch (error: any) {
      console.error(error);
      addLog(`[ERROR] Ceremony aborted: ${error.message || error}`);
      setPodStatus("error");
    }
  };

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
                  <><Wallet className="h-4 w-4" /> Initialize Session Anchor</>
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

                {/* PoD Identity Passport */}
                <GlassCard className="flex flex-col gap-5 border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className={cn("h-5 w-5", podStatus === "verified" ? "text-emerald-400" : "text-amber-400")} />
                      <p className="font-display text-sm font-bold text-white uppercase tracking-wider">Proof of Device</p>
                    </div>
                    {podStatus === "verified" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                        VERIFIED HUMAN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                        ANONYMOUS
                      </span>
                    )}
                  </div>

                  {podStatus === "verified" ? (
                    <div className="flex flex-col gap-4 rounded-xl border border-emerald-500/25 bg-emerald-950/10 p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Identity Tag</p>
                          <p className="text-xs font-mono font-bold tracking-tight text-emerald-300">
                            STATUS: HARDWARE-ATTESTED HUMAN [100%]
                          </p>
                        </div>
                      </div>
                      <div className="h-px bg-emerald-500/10" />
                      <div className="flex flex-col gap-2">
                        <div>
                          <p className="text-[10px] uppercase text-slate-500">secp256r1 Public Key</p>
                          <p className="break-all font-mono text-[10px] text-slate-300">
                            {podKey ? `${podKey.slice(0, 18)}...${podKey.slice(-18)}` : "Hardware Enclave Secured"}
                          </p>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-1">
                          <span className="text-slate-400">Sybil Resistance Score:</span>
                          <span className="font-bold text-emerald-400">100% (Maximum)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/40 p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <Fingerprint className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Identity Tag</p>
                          <p className="text-xs font-mono font-bold tracking-tight text-amber-400">
                            STATUS: UNVERIFIED ANONYMOUS SATELLITE
                          </p>
                        </div>
                      </div>
                      <div className="h-px bg-white/10" />
                      <p className="text-xs leading-relaxed text-slate-400">
                        Bind your browser's Secure Enclave key to your wallet. Instantly prove human uniqueness on-chain with zero gas fees.
                      </p>
                      {podStatus === "registering" ? (
                        <Button variant="outline" size="md" fullWidth disabled>
                          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                          Ceremony in Progress…
                        </Button>
                      ) : (
                        <Button variant="primary" size="md" fullWidth onClick={startPoDRegistration}>
                          <Fingerprint className="h-4 w-4" />
                          Generate Proof of Device
                        </Button>
                      )}
                    </div>
                  )}

                  {/* System Logger Console */}
                  {podLogs.length > 0 && (
                    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black p-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live System Logger</p>
                      <div className="max-h-32 overflow-y-auto flex flex-col gap-1.5 font-mono text-[10px] text-slate-400 scrollbar-thin scrollbar-thumb-white/10">
                        {podLogs.map((log, idx) => (
                          <div key={idx} className={cn(
                            "leading-relaxed",
                            log.startsWith("[SUCCESS]") && "text-emerald-400",
                            log.startsWith("[ERROR]") && "text-red-400",
                            log.startsWith("[OK]") && "text-blue-400",
                            log.startsWith("[PENDING]") && "text-amber-400"
                          )}>
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
