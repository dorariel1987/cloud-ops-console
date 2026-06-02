"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface CostTrendChartProps {
  data: Array<{ date: string; aws: number; azure: number; gcp: number }>;
  showProviders: { aws: boolean; azure: boolean; gcp: boolean };
}

export function CostTrendChart({ data, showProviders }: CostTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="g-aws" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--aws))" stopOpacity={0.6} />
            <stop offset="100%" stopColor="hsl(var(--aws))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="g-azure" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--azure))" stopOpacity={0.6} />
            <stop offset="100%" stopColor="hsl(var(--azure))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="g-gcp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--gcp))" stopOpacity={0.6} />
            <stop offset="100%" stopColor="hsl(var(--gcp))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => format(parseISO(d), "MMM d")}
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          minTickGap={32}
        />
        <YAxis
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
            color: "hsl(var(--popover-foreground))",
            boxShadow: "0 4px 14px hsl(0 0% 0% / 0.18)",
          }}
          itemStyle={{ color: "hsl(var(--popover-foreground))" }}
          labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
          labelFormatter={(d) => format(parseISO(d as string), "MMM d, yyyy")}
          formatter={(v: number, name: string) => [formatCurrency(v), name.toUpperCase()]}
        />
        {showProviders.aws && (
          <Area
            type="monotone"
            dataKey="aws"
            stackId="1"
            stroke="hsl(var(--aws))"
            strokeWidth={1.5}
            fill="url(#g-aws)"
          />
        )}
        {showProviders.azure && (
          <Area
            type="monotone"
            dataKey="azure"
            stackId="1"
            stroke="hsl(var(--azure))"
            strokeWidth={1.5}
            fill="url(#g-azure)"
          />
        )}
        {showProviders.gcp && (
          <Area
            type="monotone"
            dataKey="gcp"
            stackId="1"
            stroke="hsl(var(--gcp))"
            strokeWidth={1.5}
            fill="url(#g-gcp)"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
