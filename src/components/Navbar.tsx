"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Cpu,
  Loader2,
  ChevronDown,
  LogOut,
  Copy,
  Check,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { getXlmBalance } from "@/lib/stellar-client";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { walletAddress, connecting, connectWallet, disconnectWallet } = useWallet();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  useEffect(() => {
    let active = true;
    if (!walletAddress) {
      Promise.resolve().then(() => { if (active) setBalance(null); });
      return () => { active = false; };
    }
    getXlmBalance(walletAddress)
      .then((bal) => { if (active) setBalance(bal); })
      .catch(() => { if (active) setBalance(null); });
    return () => { active = false; };
  }, [walletAddress]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowWalletMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navLinks = [
    { label: "Features", href: "/features" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Docs", href: "/docs" },
  ];

  return (
    <header className="sticky top-2 sm:top-4 z-50 mx-auto w-full max-w-6xl px-3 sm:px-6 font-sans">
      <nav
        className="flex h-14 items-center justify-between rounded-full border border-slate-200/80 bg-white/85 px-4 sm:px-6 backdrop-blur-2xl shadow-[0_4px_25px_rgba(0,0,0,0.04)] transition-all font-sans min-w-0"
        aria-label="Main navigation"
      >
        {/* Left Side: Logo & Brand */}
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 no-underline group shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#15349e] text-white shadow-[0_0_15px_rgba(21,52,158,0.3)] group-hover:bg-[#102a83] transition-all shrink-0">
            <Cpu className="h-4 w-4" />
          </div>
          <span className="font-display text-base sm:text-lg font-extrabold tracking-tight text-[#0a0f1d]">
            BeamAuth
          </span>
        </Link>

        {/* Right Side: Nav Links Wrapper & Connect Wallet Action */}
        <div className="hidden md:flex items-center gap-3 font-sans">
          {/* Single Pill Wrapper for Features, Dashboard, Docs */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 shadow-inner">
            {navLinks.map(({ label, href }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "text-xs font-bold transition-all py-1.5 px-4 rounded-full select-none",
                    isActive
                      ? "text-[#0a0f1d] bg-white shadow-sm border border-slate-200/80"
                      : "text-slate-600 hover:text-[#0a0f1d] hover:bg-white/60"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Connect Wallet / Wallet Menu */}
          <div className="flex items-center gap-2.5 font-sans" ref={menuRef}>
            {walletAddress ? (
              <div className="relative flex items-center gap-1.5">
                {/* Connected Pill: Wallet Icon + Address + Balance */}
                <button
                  type="button"
                  onClick={() => setShowWalletMenu((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 sm:gap-2.5 rounded-full border border-slate-200 bg-white px-3 sm:px-4 py-1.5 font-sans text-xs text-[#0a0f1d] hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer select-none shadow-sm max-w-[180px] sm:max-w-none"
                >
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-[#15349e] text-white shrink-0">
                    <Wallet className="h-3 w-3" />
                  </div>
                  <span className="font-semibold text-[#0a0f1d] tracking-tight truncate">{shortAddr}</span>
                  {balance !== null && (
                    <span className="hidden lg:flex items-center gap-1.5">
                      <span className="text-slate-300">•</span>
                      <span className="text-[#15349e] font-bold whitespace-nowrap">{balance} XLM</span>
                    </span>
                  )}
                  <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform shrink-0", showWalletMenu && "rotate-180")} />
                </button>

                {/* Quick Disconnect Button */}
                <button
                  type="button"
                  onClick={disconnectWallet}
                  title="Disconnect Wallet"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-white hover:border-[#15349e] hover:bg-[#15349e] transition-all cursor-pointer shadow-sm"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>

                {/* Dropdown Menu */}
                {showWalletMenu && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-3 font-sans text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2 text-[#15349e] font-bold">
                        <span className="h-2 w-2 rounded-full bg-[#15349e]" />
                        <span>Synced with Wallet</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-600 font-semibold">
                        TESTNET
                      </span>
                    </div>

                    {/* Address Box */}
                    <div className="flex flex-col gap-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Anchor Address</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[#0a0f1d] text-[11px] truncate">{walletAddress}</span>
                        <button
                          type="button"
                          onClick={copyAddress}
                          className="p-1 text-slate-500 hover:text-[#0a0f1d] hover:bg-slate-200 rounded-md transition-colors shrink-0"
                          title="Copy address"
                        >
                          {copied ? <Check className="h-3.5 w-3.5 text-[#15349e]" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {balance !== null && (
                        <div className="mt-1 pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs">
                          <span className="text-slate-500">Available Balance:</span>
                          <span className="font-bold text-[#15349e]">{balance} XLM</span>
                        </div>
                      )}
                    </div>

                    {/* Disconnect Wallet Action */}
                    <button
                      type="button"
                      onClick={() => {
                        disconnectWallet();
                        setShowWalletMenu(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[#0a0f1d] font-bold hover:bg-[#15349e] hover:text-white hover:border-[#15349e] transition-all cursor-pointer font-sans"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Disconnect Wallet</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Disconnected Button: Deep Cobalt Blue (#15349e) */
              <button
                type="button"
                onClick={connectWallet}
                disabled={connecting}
                className="inline-flex items-center gap-2 rounded-full bg-[#15349e] px-5 py-2 font-sans text-xs font-bold text-white shadow-[0_4px_15px_rgba(21,52,158,0.25)] hover:bg-[#102a83] active:scale-95 transition-all cursor-pointer select-none"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 text-white" />
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:text-[#0a0f1d] hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {open && (
        <div className="mt-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl backdrop-blur-2xl md:hidden animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
          <div className="flex flex-col gap-3">
            {navLinks.map(({ label, href }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "text-[#0a0f1d] bg-slate-100 font-semibold border border-slate-200"
                      : "text-slate-600 hover:text-[#0a0f1d] hover:bg-slate-50"
                  )}
                >
                  <span>{label}</span>
                  <span className="text-[#15349e]">→</span>
                </Link>
              );
            })}

            <div className="my-1 h-px bg-slate-100" />

            {/* Mobile Wallet Section */}
            {walletAddress ? (
              <div className="flex flex-col gap-3 font-sans">
                <div className="flex flex-col gap-1.5 rounded-2xl border border-[#15349e]/20 bg-[#15349e]/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#15349e] text-xs font-bold">
                      <ShieldCheck className="h-4 w-4 text-[#15349e]" />
                      <span>Synced with Wallet</span>
                    </div>
                    <span className="text-[10px] text-slate-600 px-2 py-0.5 rounded-full bg-white border border-slate-200 font-semibold">
                      TESTNET
                    </span>
                  </div>
                  <span className="font-mono text-[#0a0f1d] text-xs font-bold mt-1 tracking-tight truncate">{walletAddress}</span>
                  {balance !== null && (
                    <span className="text-[#0a0f1d] text-xs font-bold mt-1">Balance: <span className="text-[#15349e]">{balance} XLM</span></span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    disconnectWallet();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#0a0f1d] font-bold hover:bg-[#15349e] hover:text-white transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  connectWallet();
                }}
                disabled={connecting}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#15349e] px-4 py-3 font-sans text-sm font-bold text-white shadow-[0_4px_15px_rgba(21,52,158,0.25)]"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 text-white" />
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
