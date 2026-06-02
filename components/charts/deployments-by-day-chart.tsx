"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DeploymentsByDayChartProps {
  data: Array<{ day: string; succeeded: number; failed: number }>;
}

export function DeploymentsByDayChart({ data }: DeploymentsByDayChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={32}
        />
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
          labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
        />
        <Bar dataKey="succeeded" stackId="a" fill="hsl(var(--success))" radius={[0, 0, 0, 0]} />
        <Bar dataKey="failed" stackId="a" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
