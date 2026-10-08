import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        accent: "border-transparent bg-accent/12 text-accent",
        outline: "border-border text-foreground",
        gold: "border-transparent bg-amber-400/18 text-amber-700 dark:text-amber-300",
        silver: "border-transparent bg-slate-400/18 text-slate-700 dark:text-slate-300",
        bronze: "border-transparent bg-orange-500/16 text-orange-700 dark:text-orange-300",
        destructive: "border-transparent bg-destructive/12 text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
