"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

const VARIANTS = {
  primary:
    "bg-accent text-[#04150c] hover:bg-[#2bf49c] shadow-[0_0_0_1px_rgba(23,229,138,0.4)]",
  gold: "bg-gold text-[#241a02] hover:bg-[#f6cd6c] shadow-[0_0_0_1px_rgba(242,193,78,0.4)]",
  outline:
    "bg-transparent border border-surface-border text-foreground hover:bg-white/5 hover:border-white/20",
  ghost: "bg-transparent text-foreground hover:bg-white/5",
  danger: "bg-danger/15 text-red-400 border border-danger/30 hover:bg-danger/25",
};

const SIZES = {
  sm: "text-xs px-3 py-1.5 gap-1.5 rounded-lg",
  md: "text-sm px-4 py-2 gap-2 rounded-xl",
  lg: "text-base px-6 py-3 gap-2 rounded-xl",
};

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  pulse?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", pulse, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
          VARIANTS[variant],
          SIZES[size],
          pulse && "animate-pulse-cta",
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export default Button;
