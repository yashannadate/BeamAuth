"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { useWallet } from "@/context/WalletContext";

const NAV_LINKS = [
  { label: "Features",  href: "#features"  },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Docs",      href: "https://docs.stellar.org", external: true },
  { label: "Dashboard", href: "/dashboard" },
];

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const { walletAddress: walletAddr, connecting, connectWallet: handleConnectFreighter } = useWallet();

  // Shrink nav on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const shortAddr = walletAddr
    ? `${walletAddr.slice(0, 4)}…${walletAddr.slice(-4)}`
    : null;

  return (
    <nav
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "glass-card py-3"
          : "bg-transparent py-5"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 group" id="nav-logo">
            <div className="relative flex items-center justify-center w-9 h-9">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border border-blue-500/40 group-hover:border-blue-400/70 transition-colors duration-300" />
              {/* Inner glow dot */}
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_8px_2px_rgba(37,99,235,0.6)] group-hover:shadow-[0_0_12px_4px_rgba(96,165,250,0.7)] transition-all duration-300" />
              {/* Orbit accent */}
              <div
                className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/80"
                style={{
                  top: "4px",
                  right: "4px",
                  boxShadow: "0 0 6px 2px rgba(34,211,238,0.5)",
                }}
              />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Beam<span className="text-blue-400">Auth</span>
            </span>
          </Link>

          {/* ── Desktop links ── */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="text-sm font-medium text-beam-muted hover:text-white transition-colors duration-200 relative group"
                id={`nav-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-blue-400 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* ── CTA + Connect ── */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/dashboard" className="btn-outline text-sm py-2 px-4" id="nav-cta-dashboard">
              Launch App
            </Link>

            {walletAddr ? (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/30 bg-blue-950/30 text-sm font-mono text-blue-300"
                id="nav-wallet-address"
              >
                <span className="glow-dot w-2 h-2 inline-block" />
                {shortAddr}
              </div>
            ) : (
              <button
                id="nav-connect-freighter"
                onClick={handleConnectFreighter}
                disabled={connecting}
                className="btn-primary text-sm py-2 px-4 disabled:opacity-60 disabled:cursor-wait"
              >
                {connecting ? (
                  <>
                    <span className="spinner w-4 h-4" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M4 4h16v4H4V4zm0 6h10v4H4v-4zm0 6h7v4H4v-4z" opacity=".4"/>
                      <path d="M19 12l-5 5v-3H9v-4h5V7l5 5z"/>
                    </svg>
                    Connect Freighter
                  </>
                )}
              </button>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            id="nav-mobile-menu-toggle"
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className={clsx("w-6 h-0.5 bg-white transition-all duration-300", menuOpen && "rotate-45 translate-y-2")} />
            <span className={clsx("w-6 h-0.5 bg-white transition-all duration-300", menuOpen && "opacity-0")} />
            <span className={clsx("w-6 h-0.5 bg-white transition-all duration-300", menuOpen && "-rotate-45 -translate-y-2")} />
          </button>
        </div>

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-beam-border pt-4 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-beam-muted hover:text-white transition-colors text-sm font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleConnectFreighter}
              disabled={connecting || !!walletAddr}
              className="btn-primary w-full mt-2"
            >
              {walletAddr ? shortAddr : "Connect Freighter"}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
