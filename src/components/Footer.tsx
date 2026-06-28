import Link from "next/link";
import { Zap } from "lucide-react";
import { PageContainer } from "@/components/ui/layout";

const FOOTER = {
  Protocol: [
    { label: "Documentation", href: "https://docs.stellar.org" },
    { label: "Smart Contracts", href: "https://soroban.stellar.org" },
    { label: "Testnet Explorer", href: "https://stellar.expert/explorer/testnet" },
  ],
  Company: [
    { label: "About", href: "https://stellar.org/foundation" },
    { label: "Careers", href: "https://stellar.org/foundation/careers" },
    { label: "Contact", href: "mailto:hello@beamauth.io" },
  ],
  Resources: [
    { label: "Developer Portal", href: "/dashboard" },
    { label: "Claim Demo", href: "/claim?demo=true" },
    { label: "GitHub", href: "https://github.com" },
  ],
};

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 py-12">
      <PageContainer>
        <div className="mb-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500">
                <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </span>
              <span className="font-display text-base font-bold text-white">BeamAuth</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Non-custodial payment streaming and escrow on Stellar Soroban.
            </p>
          </div>

          {Object.entries(FOOTER).map(([title, links]) => (
            <div key={title}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white">
                {title}
              </p>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-sm text-slate-400 transition-colors hover:text-blue-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          © 2024 BeamAuth Protocol. Engineered for the Stellar Ecosystem.
        </p>
      </PageContainer>
    </footer>
  );
}
