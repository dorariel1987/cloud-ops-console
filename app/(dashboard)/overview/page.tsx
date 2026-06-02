import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
  Rocket,
  Siren,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/shared/metric-card";
import { CloudBadge } from "@/components/shared/cloud-badge";
import { DeploymentStatusPill, SeverityPill } from "@/components/shared/status-pill";
import { ProviderShareChart } from "@/components/charts/provider-share-chart";
import { CostTrendChart } from "@/components/charts/cost-trend-chart";
import {
  getAggregatedCost,
  getAggregatedDeployments,
  getAggregatedIncidents,
  getOverview,
} from "@/lib/providers/registry";
import { parseSearchParams, type PageSearchParams } from "@/lib/page-utils";
import { PROVIDERS, PROVIDER_META, type ProviderId } from "@/lib/types";
import { formatCurrency, formatDuration, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const sp = await searchParams;
  const { providers, activeProviders, rangeDays } = parseSearchParams(sp);

  const [overview, cost, deployments, incidents] = await Promise.all([
    getOverview(providers),
    getAggregatedCost(rangeDays, providers),
    getAggregatedDeployments(7, providers),
    getAggregatedIncidents(7, providers),
  ]);

  const providerShare = PROVIDERS.filter((p) => activeProviders.includes(p)).map(
    (p) => ({ provider: p, amount: overview.cost.byProvider[p] ?? 0 }),
  );

  const showProviders = {
    aws: activeProviders.includes("aws"),
    azure: activeProviders.includes("azure"),
    gcp: activeProviders.includes("gcp"),
  };

  const recentFailures = deployments.recent.filter(
    (d) => d.status === "failed" || d.status === "rolled_back",
  );

  return (
    <>
      <Header
        title="Overview"
        description={`Unified state across ${activeProviders.length} cloud${activeProviders.length === 1 ? "" : "s"} · last ${rangeDays} days`}
      />

      <main className="flex-1 space-y-6 p-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Cloud spend (forecast)"
            value={formatCurrency(overview.cost.forecast, { compact: true })}
            changePct={overview.cost.changePct}
            invertColors
            changeLabel="vs last month"
            icon={<CreditCard className="h-4 w-4" />}
            accent="info"
          />
          <MetricCard
            label="Deploys / 24h"
            value={String(overview.deployments.last24h)}
            changeLabel={`${overview.deployments.successRatePct}% success rate`}
            icon={<Rocket className="h-4 w-4" />}
            accent="success"
          />
          <MetricCard
            label="Open incidents"
            value={String(overview.incidents.open)}
            changeLabel={`${overview.incidents.sev1} SEV1 · ${overview.incidents.sev2} SEV2`}
            icon={<Siren className="h-4 w-4" />}
            accent={overview.incidents.sev1 > 0 ? "destructive" : "warning"}
          />
          <MetricCard
            label="MTTR"
            value={formatDuration(overview.incidents.mttrMs)}
            changeLabel="Mean time to resolve"
            icon={<Activity className="h-4 w-4" />}
            accent="default"
          />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Spend trend</CardTitle>
                <CardDescription>
                  Daily cost across selected clouds (last {rangeDays} days)
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/cost">
                  Open Cost <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <CostTrendChart data={cost.trend} showProviders={showProviders} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spend split</CardTitle>
              <CardDescription>Month to date by provider</CardDescription>
            </CardHeader>
            <CardContent>
              <ProviderShareChart data={providerShare} />
              <div className="mt-4 space-y-2">
                {providerShare.map((p) => (
                  <div key={p.provider} className="flex items-center justify-between text-xs">
                    <CloudBadge provider={p.provider} />
                    <span className="font-medium tabular-nums">
                      {formatCurrency(p.amount, { compact: true })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active incidents</CardTitle>
                <CardDescription>Open across all selected clouds</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/oncall">
                  Open On-Call <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {incidents.active.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-10 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium">All quiet across {activeProviders.length} clouds.</p>
                  <p className="text-xs text-muted-foreground">No active incidents in this view.</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {incidents.active.slice(0, 6).map((i) => (
                    <li key={i.id} className="flex items-center gap-4 px-6 py-3">
                      <SeverityPill severity={i.severity} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{i.title}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {i.service} · {i.source} · {relativeTime(i.triggeredAt)}
                        </span>
                      </div>
                      <CloudBadge provider={i.provider} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent deployments</CardTitle>
                <CardDescription>Latest across pipelines</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/deployments">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {deployments.recent.slice(0, 7).map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-6 py-3 text-sm">
                    <DeploymentStatusPill status={d.status} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{d.service}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        v{d.version} · {relativeTime(d.startedAt)}
                      </span>
                    </div>
                    <CloudBadge provider={d.provider} variant="ghost" />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Cost anomalies
              </CardTitle>
              <CardDescription>Auto-detected spikes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {cost.anomalies.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <CloudBadge provider={a.provider} variant="ghost" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{a.service}</span>
                      <Badge variant="warning">+{a.deltaPct.toFixed(0)}%</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(a.actual)} vs {formatCurrency(a.expected)} expected ·{" "}
                      {relativeTime(a.detectedAt)}
                    </div>
                  </div>
                </div>
              ))}
              {cost.anomalies.length === 0 && (
                <p className="text-xs text-muted-foreground">No anomalies detected.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-info" />
                Top services
              </CardTitle>
              <CardDescription>By month-to-date spend</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {cost.topServices.slice(0, 6).map((s) => (
                <div key={`${s.provider}-${s.service}`} className="flex items-center gap-3 text-sm">
                  <CloudBadge provider={s.provider} variant="ghost" />
                  <span className="flex-1 truncate">{s.service}</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(s.amount, { compact: true })}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-success" />
                Recent failures
              </CardTitle>
              <CardDescription>Failed or rolled-back deploys</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentFailures.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-start gap-3 text-sm">
                  <DeploymentStatusPill status={d.status} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{d.service}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {PROVIDER_META[d.provider as ProviderId].shortName} · {d.environment} ·{" "}
                      v{d.version} · {relativeTime(d.startedAt)}
                    </div>
                  </div>
                </div>
              ))}
              {recentFailures.length === 0 && (
                <p className="text-xs text-muted-foreground">No recent failures.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
