import { ArrowDownRight, ArrowUpRight, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  hint?: string;
  delta: number;
  spark: number[];
  invert?: boolean;
  alert?: boolean;
  icon?: LucideIcon;
  index?: number;
};

function Sparkline({ points, positive }: { points: number[]; positive: boolean }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 100;
    const y = 28 - ((p - min) / range) * 24;
    return `${x},${y}`;
  });
  const stroke = positive ? "var(--color-success)" : "var(--color-destructive)";

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-9 w-24" aria-hidden>
      <polyline
        points={`0,32 ${coords.join(" ")} 100,32`}
        fill={stroke}
        opacity="0.12"
        stroke="none"
      />
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  delta,
  spark,
  invert,
  alert,
  icon: Icon,
  index = 0,
}: Props) {
  const good = invert ? delta <= 0 : delta >= 0;

  return (
    <div
      className="animate-fade rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          {Icon && <Icon className="size-4 text-primary" />}
          {label}
        </p>
        {alert && <TriangleAlert className="size-4 shrink-0 text-warning" />}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="font-mono text-2xl font-semibold tracking-tight whitespace-nowrap text-foreground">
          {value}
        </p>
        <Sparkline points={spark} positive={good} />
      </div>
      <p
        className={cn(
          "mt-2 flex flex-wrap items-center gap-1 text-xs font-medium",
          good ? "text-success" : "text-destructive",
        )}
      >
        {delta >= 0 ? (
          <ArrowUpRight className="size-3.5" />
        ) : (
          <ArrowDownRight className="size-3.5" />
        )}
        {Math.abs(delta).toLocaleString("pt-BR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}
        %<span className="font-normal text-muted-foreground">{hint ?? "vs. período anterior"}</span>
      </p>
    </div>
  );
}
