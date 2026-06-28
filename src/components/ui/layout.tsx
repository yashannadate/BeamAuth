import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative z-10 flex min-h-screen flex-col", className)}>
      {children}
    </div>
  );
}

export function PageContainer({
  children,
  className,
  narrow,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6",
        narrow ? "max-w-3xl" : "max-w-6xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Section({
  children,
  className,
  hero,
}: {
  children: React.ReactNode;
  className?: string;
  hero?: boolean;
}) {
  return (
    <section
      className={cn(
        hero ? "py-16 pt-28 sm:py-20 sm:pt-36" : "py-12 sm:py-16",
        className
      )}
    >
      {children}
    </section>
  );
}
