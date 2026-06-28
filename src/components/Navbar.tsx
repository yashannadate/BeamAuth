"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Wallet,
  Zap,
  BookOpen,
  Globe,
  Shield,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { getXlmBalance } from "@/lib/stellar-client";
import { Button, ButtonLink } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Docs", href: "https://docs.stellar.org", icon: BookOpen },
  { label: "Network", href: "https://stellar.org/network", icon: Globe },
  { label: "Governance", href: "https://stellar.org/foundation", icon: Shield },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const { walletAddress, connecting, connectWallet } = useWallet();

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:px-6">
      <nav
        className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 backdrop-blur-md"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.4)]">
            <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            BeamAuth
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden items-center justify-center gap-8 md:flex">
          {NAV_LINKS.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-blue-400"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center justify-end gap-3 md:flex">
          {walletAddress ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 font-mono text-xs text-blue-400">
                <Wallet className="h-3 w-3" />
                {shortAddr}
              </span>
              {balance !== null && (
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-mono text-xs text-slate-300">
                  {balance} XLM
                </span>
              )}
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={connectWallet} disabled={connecting}>
              <Wallet className="h-3.5 w-3.5" />
              {connecting ? "Connecting…" : "Connect Wallet"}
            </Button>
          )}
          <ButtonLink href="/dashboard" variant="primary" size="sm">
            Get Started
          </ButtonLink>
        </div>

        {/* Mobile toggle */}
        <div className="flex justify-end md:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-slate-400 hover:text-blue-400"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="mx-auto mt-2 flex max-w-6xl flex-col gap-3 rounded-2xl border border-white/10 bg-black/90 p-5 backdrop-blur-md">
          {NAV_LINKS.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-blue-400"
              onClick={() => setOpen(false)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </a>
          ))}
          <div className="my-1 h-px bg-white/10" />
          {walletAddress ? (
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-1.5 font-mono text-xs text-blue-400">
                <Wallet className="h-3.5 w-3.5" />
                {shortAddr}
                {balance !== null && ` · ${balance} XLM`}
              </span>
            </div>
          ) : (
            <Button
              variant="outline"
              fullWidth
              onClick={() => { setOpen(false); connectWallet(); }}
              disabled={connecting}
            >
              {connecting ? "Connecting…" : "Connect Wallet"}
            </Button>
          )}
          <ButtonLink href="/dashboard" variant="primary" fullWidth onClick={() => setOpen(false)}>
            Get Started
          </ButtonLink>
        </div>
      )}
    </header>
  );
}
