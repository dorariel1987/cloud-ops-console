"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PROVIDER_META, type ProviderId } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ProviderShareChartProps {
  data: Array<{ provider: ProviderId; amount: number }>;
}

const COLOR: Record<ProviderId, string> = {
  aws: "hsl(var(--aws))",
  azure: "hsl(var(--azure))",
  gcp: "hsl(var(--gcp))",
};

export function ProviderShareChart({ data }: ProviderShareChartProps) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="provider"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            stroke="hsl(var(--background))"
            strokeWidth={2}
          >
            {data.map((d) => (
              <Cell key={d.provider} fill={COLOR[d.provider]} />
            ))}
          </Pie>
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
              color: "hsl(var(--popover-foreground))",
              boxShadow: "0 4px 14px hsl(0 0% 0% / 0.18)",
            }}
            itemStyle={{ color: "hsl(var(--popover-foreground))" }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            formatter={(v: number, name: string) => [
              formatCurrency(v),
              PROVIDER_META[name as ProviderId]?.shortName ?? name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          MTD Total
        </span>
        <span className="text-xl font-semibold tabular-nums">
          {formatCurrency(total, { compact: true })}
        </span>
      </div>
    </div>
  );
}
