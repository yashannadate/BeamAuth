import Link from "next/link";
import {
  Fingerprint,
  Zap,
  Globe2,
  ArrowRight,
  Timer,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BeamsBackground } from "@/components/ui/beams-background";
import { ButtonLink } from "@/components/ui/button";
import { GlassCard, PageShell, PageContainer, Section } from "@/components/ui/layout";

const STATS = [
  { label: "Claim Time", value: "< 2s", icon: Timer },
  { label: "Gas Fees", value: "$0.00", icon: DollarSign },
  { label: "Custody", value: "Non-Custodial", icon: ShieldCheck },
];

const FEATURES = [
  {
    title: "No Seed Phrases",
    desc: "Authenticate with passkeys — Face ID, Touch ID, or Windows Hello. Zero mnemonic exposure.",
    icon: Fingerprint,
  },
  {
    title: "Zero Gas Fees",
    desc: "Network cost abstraction via sponsored transactions. Recipients never need XLM to claim.",
    icon: Zap,
  },
  {
    title: "No Bridging",
    desc: "Unified balance across markets on Stellar. One network, one settlement layer.",
    icon: Globe2,
  },
];

export default function HomePage() {
  return (
    <BeamsBackground intensity="strong">
      <PageShell>
        <Navbar />

        <main className="flex-1">
          {/* Hero */}
          <Section hero>
            <PageContainer narrow className="flex flex-col items-center gap-8 text-center">
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
                Beam into the{" "}
                <span className="text-blue-400">Next Era</span> of Stellar Payments.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
                The institutional-grade authentication layer for seamless, gasless,
                and passwordless transactions on the Stellar network.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <ButtonLink href="/dashboard" variant="primary" size="lg">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/dashboard" variant="glass" size="lg">
                  Open App
                </ButtonLink>
              </div>
            </PageContainer>
          </Section>

          {/* Stats */}
          <Section className="!py-0 pb-12 sm:pb-16">
            <PageContainer narrow>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {STATS.map(({ label, value, icon: Icon }) => (
                  <GlassCard key={label} className="flex flex-col items-center gap-2 py-6 text-center">
                    <Icon className="h-5 w-5 text-blue-400" />
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
                    <p className="font-display text-2xl font-bold text-blue-400">{value}</p>
                  </GlassCard>
                ))}
              </div>
            </PageContainer>
          </Section>

          {/* Features */}
          <Section>
            <PageContainer className="flex flex-col gap-12">
              <h2 className="text-center font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Engineered for Frictionless Transactions
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {FEATURES.map(({ title, desc, icon: Icon }) => (
                  <GlassCard key={title} className="flex flex-col gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10">
                      <Icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-white">{title}</h3>
                    <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
                  </GlassCard>
                ))}
              </div>
            </PageContainer>
          </Section>

          {/* CTA */}
          <Section>
            <PageContainer narrow>
              <GlassCard className="flex flex-col items-center gap-6 py-12 text-center">
                <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  Ready to beam into the future of Stellar?
                </h2>
                <ButtonLink href="/dashboard" variant="primary" size="lg">
                  Create Developer Account
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </GlassCard>
            </PageContainer>
          </Section>
        </main>

        <Footer />
      </PageShell>
    </BeamsBackground>
  );
}
