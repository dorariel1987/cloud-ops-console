import { AlertTriangle, CreditCard, Target, TrendingUp } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "@/components/shared/metric-card";
import { CloudBadge } from "@/components/shared/cloud-badge";
import { CostTrendChart } from "@/components/charts/cost-trend-chart";
import { ProviderShareChart } from "@/components/charts/provider-share-chart";
import { getAggregatedCost } from "@/lib/providers/registry";
import { parseSearchParams, type PageSearchParams } from "@/lib/page-utils";
import { formatCurrency, relativeTime } from "@/lib/utils";
import { PROVIDERS, type ProviderId } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CostPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const sp = await searchParams;
  const { providers, activeProviders, rangeDays } = parseSearchParams(sp);
  const cost = await getAggregatedCost(rangeDays, providers);

  const totalMtd = cost.summaries.reduce((s, c) => s + c.currentMonth, 0);
  const totalForecast = cost.summaries.reduce((s, c) => s + c.forecast, 0);
  const totalPrev = cost.summaries.reduce((s, c) => s + c.previousMonth, 0);
  const totalBudget = cost.summaries.reduce((s, c) => s + (c.budget ?? 0), 0);
  const changePct = totalPrev ? ((totalForecast - totalPrev) / totalPrev) * 100 : 0;
  const budgetUsedPct = totalBudget ? (totalForecast / totalBudget) * 100 : 0;

  const providerShare = PROVIDERS.filter((p) => activeProviders.includes(p)).map(
    (p) => ({
      provider: p,
      amount: cost.summaries.find((s) => s.provider === p)?.currentMonth ?? 0,
    }),
  );

  const showProviders = {
    aws: activeProviders.includes("aws"),
    azure: activeProviders.includes("azure"),
    gcp: activeProviders.includes("gcp"),
  };

  return (
    <>
      <Header
        title="Cost"
        description={`Cross-cloud spend, forecast and anomalies · last ${rangeDays} days`}
      />

      <main className="flex-1 space-y-6 p-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Month to date"
            value={formatCurrency(totalMtd, { compact: true })}
            icon={<CreditCard className="h-4 w-4" />}
            accent="info"
            hint={`Across ${activeProviders.length} clouds`}
          />
          <MetricCard
            label="Forecast"
            value={formatCurrency(totalForecast, { compact: true })}
            changePct={Number(changePct.toFixed(1))}
            invertColors
            changeLabel="vs last month"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            label="Budget used"
            value={`${budgetUsedPct.toFixed(0)}%`}
            hint={formatCurrency(totalBudget, { compact: true }) + " allocated"}
            icon={<Target className="h-4 w-4" />}
            accent={budgetUsedPct > 95 ? "destructive" : budgetUsedPct > 80 ? "warning" : "success"}
          />
          <MetricCard
            label="Active anomalies"
            value={String(cost.anomalies.length)}
            icon={<AlertTriangle className="h-4 w-4" />}
            accent={cost.anomalies.length > 0 ? "warning" : "default"}
            hint="Detected last 72h"
          />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Daily spend</CardTitle>
              <CardDescription>
                Stacked by provider — last {rangeDays} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CostTrendChart data={cost.trend} showProviders={showProviders} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spend split</CardTitle>
              <CardDescription>Month to date</CardDescription>
            </CardHeader>
            <CardContent>
              <ProviderShareChart data={providerShare} />
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {cost.summaries.map((s) => (
            <Card key={s.provider}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CloudBadge provider={s.provider as ProviderId} />
                  </CardTitle>
                  <CardDescription>
                    {formatCurrency(s.currentMonth, { compact: true })} this month
                  </CardDescription>
                </div>
                <Badge variant={s.changePct > 0 ? "warning" : "success"}>
                  {s.changePct > 0 ? "+" : ""}
                  {s.changePct.toFixed(1)}%
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Forecast</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCurrency(s.forecast)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Previous month</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCurrency(s.previousMonth)}
                    </span>
                  </div>
                </div>

                {typeof s.budgetUsedPct === "number" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Budget · {formatCurrency(s.budget ?? 0, { compact: true })}
                      </span>
                      <span className="font-medium tabular-nums">
                        {s.budgetUsedPct.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(s.budgetUsedPct, 100)}
                      indicatorClassName={
                        s.budgetUsedPct > 95
                          ? "bg-destructive"
                          : s.budgetUsedPct > 80
                            ? "bg-warning"
                            : "bg-success"
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top services by spend</CardTitle>
              <CardDescription>Across selected providers</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="px-6 py-2 text-left font-medium">Service</th>
                    <th className="px-6 py-2 text-left font-medium">Cloud</th>
                    <th className="px-6 py-2 text-right font-medium">Spend</th>
                    <th className="px-6 py-2 text-right font-medium">Δ vs prev</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cost.topServices.slice(0, 10).map((s) => (
                    <tr key={`${s.provider}-${s.service}`}>
                      <td className="px-6 py-2.5 font-medium">{s.service}</td>
                      <td className="px-6 py-2.5">
                        <CloudBadge provider={s.provider} variant="ghost" />
                      </td>
                      <td className="px-6 py-2.5 text-right tabular-nums">
                        {formatCurrency(s.amount, { compact: true })}
                      </td>
                      <td className="px-6 py-2.5 text-right">
                        <Badge variant={s.changePct > 0 ? "warning" : "success"}>
                          {s.changePct > 0 ? "+" : ""}
                          {s.changePct.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Cost anomalies
              </CardTitle>
              <CardDescription>Auto-detected spend spikes vs 30-day baseline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {cost.anomalies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No anomalies detected in the current view.
                </p>
              ) : (
                cost.anomalies.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 rounded-md border bg-muted/20 p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{a.service}</span>
                        <Badge variant="warning">+{a.deltaPct.toFixed(0)}%</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <CloudBadge provider={a.provider} variant="ghost" />
                        <span>
                          {formatCurrency(a.actual)} actual vs {formatCurrency(a.expected)} expected
                        </span>
                        <span>· {relativeTime(a.detectedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
