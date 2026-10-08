import type * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export function StatCard({ label, value, hint, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="tabular mt-1 break-words text-2xl font-semibold leading-tight tracking-tight">
            {value}
          </p>
          {hint && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
    </Card>
  );
}
