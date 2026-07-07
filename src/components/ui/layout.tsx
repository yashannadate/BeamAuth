import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
  narrow = false,
}: {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", narrow ? "max-w-3xl" : "max-w-7xl", className)}>
      {children}
    </div>
  );
}

export function GlassCard({
  children,
  className,
  hoverEffect = false,
}: {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-[#0a0f1d] transition-all font-sans",
        hoverEffect && "hover:border-[#15349e]/40 hover:shadow-[0_15px_35px_rgba(21,52,158,0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-[#f4f6fb] text-[#0a0f1d] antialiased selection:bg-[#15349e]/20 selection:text-[#0a0f1d] font-sans", className)}>
      {children}
    </div>
  );
}
