import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-sans font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#15349e]/50 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer",
          
          variant === "primary" &&
            "bg-[#15349e] text-white shadow-[0_4px_20px_rgba(21,52,158,0.25)] hover:bg-[#102a83] hover:shadow-[0_6px_25px_rgba(21,52,158,0.35)] active:scale-[0.98] border border-[#15349e]",
          
          variant === "secondary" &&
            "bg-slate-100 text-[#0a0f1d] border border-slate-200 hover:bg-slate-200 active:scale-[0.98]",
          
          variant === "outline" &&
            "border border-slate-200/80 bg-white text-[#0a0f1d] hover:border-slate-300 hover:bg-slate-50 shadow-sm active:scale-[0.98]",
          
          variant === "ghost" &&
            "text-slate-600 hover:bg-slate-100 hover:text-[#0a0f1d] active:scale-[0.98]",
          
          size === "sm" && "h-8 px-4 text-xs",
          size === "md" && "h-10 px-6 text-sm",
          size === "lg" && "h-12 px-8 text-base",
          
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <a
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-sans font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#15349e]/50 no-underline select-none cursor-pointer",
          
          variant === "primary" &&
            "bg-[#15349e] text-white shadow-[0_4px_20px_rgba(21,52,158,0.25)] hover:bg-[#102a83] hover:shadow-[0_6px_25px_rgba(21,52,158,0.35)] active:scale-[0.98] border border-[#15349e]",
          
          variant === "secondary" &&
            "bg-slate-100 text-[#0a0f1d] border border-slate-200 hover:bg-slate-200 active:scale-[0.98]",
          
          variant === "outline" &&
            "border border-slate-200/80 bg-white text-[#0a0f1d] hover:border-slate-300 hover:bg-slate-50 shadow-sm active:scale-[0.98]",
          
          variant === "ghost" &&
            "text-slate-600 hover:bg-slate-100 hover:text-[#0a0f1d] active:scale-[0.98]",
          
          size === "sm" && "h-8 px-4 text-xs",
          size === "md" && "h-10 px-6 text-sm",
          size === "lg" && "h-12 px-8 text-base",
          
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </a>
    );
  }
);
ButtonLink.displayName = "ButtonLink";
