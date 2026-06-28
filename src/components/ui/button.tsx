import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "glass" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: [
    "relative overflow-hidden font-semibold text-white",
    "bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400",
    "border border-blue-400/30",
    "shadow-[0_0_20px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]",
    "hover:shadow-[0_0_32px_rgba(59,130,246,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]",
    "hover:brightness-110",
    "active:scale-[0.98]",
  ].join(" "),
  outline: [
    "font-medium text-white",
    "border border-white/20 bg-transparent",
    "hover:border-blue-500/50 hover:bg-blue-500/10",
    "active:scale-[0.98]",
  ].join(" "),
  glass: [
    "font-medium text-white",
    "border border-white/10 bg-white/5 backdrop-blur-md",
    "hover:bg-white/10 hover:border-white/20",
    "active:scale-[0.98]",
  ].join(" "),
  ghost: [
    "font-medium text-slate-400",
    "hover:text-blue-400 hover:bg-white/5",
    "active:scale-[0.98]",
  ].join(" "),
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 rounded-lg px-3.5 text-xs",
  md: "h-10 gap-2 rounded-xl px-5 text-sm",
  lg: "h-12 gap-2.5 rounded-xl px-7 text-sm",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";

export interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  fullWidth,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a
      className={cn(
        "inline-flex items-center justify-center transition-all duration-200 no-underline",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}
