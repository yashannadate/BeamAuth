"use client";

/**
 * app/page.tsx
 *
 * A high-fidelity, tactical landing page inspired by premium card-deck layouts.
 * Features a vibrant neon-emerald background, bold display typography, custom
 * isometric line-art SVGs, and responsive framer-motion entrance transitions.
 */

import { motion } from "framer-motion";
import { useWallet } from "@/context/WalletContext";
import { Wallet, Zap, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const { walletAddress, connectWallet, connecting } = useWallet();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  // Entrance animations setup
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 45, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 100, damping: 14 },
    },
  };

  const leftIllustVariants = {
    hidden: { x: -120, opacity: 0, scale: 0.8, rotate: -5 },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { type: "spring" as const, stiffness: 70, damping: 14, delay: 0.35 },
    },
  };

  const rightIllustVariants = {
    hidden: { x: 120, opacity: 0, scale: 0.8, rotate: 5 },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { type: "spring" as const, stiffness: 70, damping: 14, delay: 0.45 },
    },
  };

  return (
    <div className="min-h-screen w-full bg-[#00f082] text-slate-950 select-none overflow-x-hidden font-sans relative flex flex-col justify-between">
      {/* Navbar */}
      <header className="w-full px-6 py-5 max-w-7xl mx-auto flex items-center justify-between z-50">
        <Link href="/" className="font-display text-2xl font-black tracking-tighter text-slate-950 no-underline hover:opacity-90">
          BeamAuth
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {[
            { name: "Home", href: "/" },
            { name: "Dashboard", href: "/dashboard" },
            { name: "Escrows", href: "/dashboard" },
            { name: "Identity Portal", href: "/dashboard" },
          ].map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-semibold tracking-wide text-slate-950/80 hover:text-slate-950 transition-colors no-underline relative py-1"
              onMouseEnter={() => setHoveredLink(link.name)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              {link.name}
              {hoveredLink === link.name && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div>
          {walletAddress ? (
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-6 text-xs font-bold uppercase tracking-wider text-[#00f082] no-underline hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-black/10"
            >
              Anchor: {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </Link>
          ) : (
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-6 text-xs font-bold uppercase tracking-wider text-[#00f082] no-underline hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-70 shadow-lg shadow-black/10 cursor-pointer"
            >
              <Wallet className="h-3.5 w-3.5 mr-1.5" />
              {connecting ? "Connecting..." : "Initialize Session Anchor"}
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col justify-center items-center py-10 md:py-16 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-3xl flex flex-col items-center gap-6 md:gap-8 z-20"
        >
          <motion.h1 
            variants={itemVariants}
            className="font-display text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.9] text-slate-950 text-center"
          >
            Beam Once.<br/>
            Enjoy Again.
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-slate-900/80 text-sm sm:text-base md:text-lg max-w-lg leading-relaxed font-semibold"
          >
            Turn every transfer into extra value with smart biometric rewards, on-demand hardware smart wallets, and sponsored zero-fee claims.
          </motion.p>

          <motion.div variants={itemVariants}>
            <Link
              href="/dashboard"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-slate-950 px-8 text-sm font-bold uppercase tracking-widest text-[#00f082] no-underline hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl shadow-black/20 group"
            >
              <Zap className="h-4 w-4 fill-current text-[#00f082]" />
              Start Beaming Today
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Left Illustration: Money Stack */}
        <motion.div
          variants={leftIllustVariants}
          initial="hidden"
          animate="visible"
          className="absolute left-0 bottom-0 hidden lg:block pointer-events-none select-none z-10"
        >
          <svg className="w-72 h-72 text-slate-950" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="20" cy="180" r="1.5" fill="currentColor" opacity="0.3" />
            <circle cx="40" cy="180" r="1.5" fill="currentColor" opacity="0.3" />
            <circle cx="60" cy="180" r="1.5" fill="currentColor" opacity="0.3" />
            <circle cx="80" cy="180" r="1.5" fill="currentColor" opacity="0.3" />
            <circle cx="30" cy="190" r="1.5" fill="currentColor" opacity="0.3" />
            <circle cx="50" cy="190" r="1.5" fill="currentColor" opacity="0.3" />
            <circle cx="70" cy="190" r="1.5" fill="currentColor" opacity="0.3" />

            {/* Isometric cash bills */}
            <path d="M60,110 L110,85 L160,110 L110,135 Z" fill="#D1FAE5" />
            <path d="M60,110 L60,118 L110,143 L110,135" />
            <path d="M160,110 L160,118 L110,143 L110,135" />

            <path d="M60,95 L110,70 L160,95 L110,120 Z" fill="#A7F3D0" />
            <path d="M60,95 L60,103 L110,128 L110,120" />
            <path d="M160,95 L160,103 L110,128 L110,120" />

            <path d="M60,80 L110,55 L160,80 L110,105 Z" fill="#6EE7B7" />
            <path d="M60,80 L60,88 L110,113 L110,105" />
            <path d="M160,80 L160,88 L110,113 L110,105" />

            {/* Bill details */}
            <ellipse cx="110" cy="80" rx="16" ry="8" />
            <text x="110" y="83" fontFamily="monospace" fontSize="10" fontWeight="bold" textAnchor="middle" fill="currentColor">$</text>

            {/* Coin Stack */}
            <path d="M30,120 L30,128 A10,5 0 0,0 50,128 L50,120 A10,5 0 0,0 30,120 Z" fill="#A7F3D0" />
            <path d="M30,128 L30,136 A10,5 0 0,0 50,136 L50,128" />
            <path d="M30,136 L30,144 A10,5 0 0,0 50,144 L50,136" />

            {/* Standing Coin */}
            <circle cx="45" cy="155" r="10" fill="#D1FAE5" />
            <text x="45" y="158" fontFamily="monospace" fontSize="8" fontWeight="bold" textAnchor="middle" fill="currentColor">S</text>
          </svg>
        </motion.div>

        {/* Right Illustration: Secure Enclave Vault Box */}
        <motion.div
          variants={rightIllustVariants}
          initial="hidden"
          animate="visible"
          className="absolute right-0 bottom-0 hidden lg:block pointer-events-none select-none z-10"
        >
          <svg className="w-72 h-72 text-slate-950" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {/* Isometric Vault Box (representing passkey Smart Wallet) */}
            <path d="M100,50 L160,80 L100,110 L40,80 Z" fill="#D1FAE5" />
            <path d="M40,80 L40,140 L100,170 L100,110 Z" fill="#A7F3D0" />
            <path d="M160,80 L160,140 L100,170 L100,110 Z" fill="#6EE7B7" />

            {/* Lock detail */}
            <ellipse cx="70" cy="130" rx="8" ry="12" />
            <line x1="70" y1="142" x2="70" y2="152" />

            {/* Coins dropping */}
            <ellipse cx="100" cy="20" rx="8" ry="4" fill="#6EE7B7" />
            <line x1="100" y1="20" x2="100" y2="40" strokeDasharray="3,3" />

            <ellipse cx="125" cy="35" rx="8" ry="4" fill="#D1FAE5" />
            <line x1="125" y1="35" x2="125" y2="60" strokeDasharray="3,3" />

            <ellipse cx="140" cy="115" rx="8" ry="4" fill="#D1FAE5" />
            <ellipse cx="145" cy="125" rx="8" ry="4" fill="#A7F3D0" />
          </svg>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-950/10 text-xs font-semibold text-slate-950/65 z-20">
        <p>© 2026 BeamAuth. Built for Stellar Journey to Mastery 2.0.</p>
        <p>Released under the MIT License.</p>
      </footer>
    </div>
  );
}
