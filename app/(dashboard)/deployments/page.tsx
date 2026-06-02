import { Activity, Clock, GitCommit, Rocket, ShieldAlert, Timer } from "lucide-react";
import { format, parseISO, startOfDay, subDays } from "date-fns";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/shared/metric-card";
import { CloudBadge } from "@/components/shared/cloud-badge";
import { DeploymentStatusPill } from "@/components/shared/status-pill";
import { DeploymentsByDayChart } from "@/components/charts/deployments-by-day-chart";
import { getAggregatedDeployments } from "@/lib/providers/registry";
import { parseSearchParams, type PageSearchParams } from "@/lib/page-utils";
import { formatDuration, relativeTime } from "@/lib/utils";
import type { Environment } from "@/lib/types";

export const dynamic = "force-dynamic";

const ENVIRONMENT_ORDER: Environment[] = ["production", "staging", "dev"];

const ENV_BADGE: Record<Environment, "default" | "info" | "secondary"> = {
  production: "default",
  staging: "info",
  dev: "secondary",
};

export default async function DeploymentsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const sp = await searchParams;
  const { providers, activeProviders, rangeDays } = parseSearchParams(sp);
  const data = await getAggregatedDeployments(rangeDays, providers);

  // Build a 7-day histogram from `recent` (the API returns enough rows for this).
  const today = startOfDay(new Date());
  const buckets: Record<string, { day: string; succeeded: number; failed: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const day = subDays(today, i);
    const key = format(day, "yyyy-MM-dd");
    buckets[key] = { day: format(day, "EEE"), succeeded: 0, failed: 0 };
  }
  for (const d of data.recent) {
    const key = format(parseISO(d.startedAt), "yyyy-MM-dd");
    if (!buckets[key]) continue;
    if (d.status === "succeeded") buckets[key].succeeded += 1;
    else if (d.status === "failed" || d.status === "rolled_back") buckets[key].failed += 1;
  }
  const histogram = Object.values(buckets);

  // Group `byService` rows by environment for the matrix view.
  const byEnv: Record<Environment, typeof data.byService> = {
    production: [],
    staging: [],
    dev: [],
  };
  for (const row of data.byService) byEnv[row.environment].push(row);

  return (
    <>
      <Header
        title="Deployments"
        description={`Pipeline activity across ${activeProviders.length} cloud${activeProviders.length === 1 ? "" : "s"} · last ${rangeDays} days`}
      />

      <main className="flex-1 space-y-6 p-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Deploys / 24h"
            value={String(data.metrics.totalLast24h)}
            icon={<Rocket className="h-4 w-4" />}
            accent="info"
            hint="Across all pipelines"
          />
          <MetricCard
            label="Success rate"
            value={`${data.metrics.successRatePct}%`}
            icon={<Activity className="h-4 w-4" />}
            accent="success"
            hint={`${data.metrics.failureRatePct}% failed/rolled back`}
          />
          <MetricCard
            label="Avg duration"
            value={formatDuration(data.metrics.avgDurationMs)}
            icon={<Timer className="h-4 w-4" />}
            hint={`Lead time ${formatDuration(data.metrics.leadTimeMs)}`}
          />
          <MetricCard
            label="Change failure rate"
            value={`${data.metrics.changeFailureRatePct}%`}
            icon={<ShieldAlert className="h-4 w-4" />}
            accent={data.metrics.changeFailureRatePct > 15 ? "warning" : "default"}
            hint="DORA metric"
          />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Deployment volume (7 days)</CardTitle>
              <CardDescription>Successful vs failed/rolled-back</CardDescription>
            </CardHeader>
            <CardContent>
              <DeploymentsByDayChart data={histogram} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>DORA snapshot</CardTitle>
              <CardDescription>Industry benchmarks for context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DoraRow
                label="Deploy frequency"
                value={`${data.metrics.totalLast24h}/day`}
                tier="Elite"
                tierVariant="success"
              />
              <DoraRow
                label="Lead time"
                value={formatDuration(data.metrics.leadTimeMs)}
                tier={data.metrics.leadTimeMs < 60 * 60 * 1000 ? "Elite" : "High"}
                tierVariant={data.metrics.leadTimeMs < 60 * 60 * 1000 ? "success" : "info"}
              />
              <DoraRow
                label="Change failure rate"
                value={`${data.metrics.changeFailureRatePct}%`}
                tier={
                  data.metrics.changeFailureRatePct < 15
                    ? "Elite"
                    : data.metrics.changeFailureRatePct < 30
                      ? "High"
                      : "Medium"
                }
                tierVariant={data.metrics.changeFailureRatePct < 15 ? "success" : "warning"}
              />
              <DoraRow
                label="MTTR"
                value={formatDuration(data.metrics.mttrMs)}
                tier="High"
                tierVariant="info"
              />
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Service status matrix</CardTitle>
            <CardDescription>Latest deployment per service & environment</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="production">
              <TabsList>
                {ENVIRONMENT_ORDER.map((env) => (
                  <TabsTrigger key={env} value={env} className="capitalize">
                    {env}{" "}
                    <span className="ml-1.5 rounded bg-muted px-1.5 text-xs font-normal text-muted-foreground">
                      {byEnv[env].length}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {ENVIRONMENT_ORDER.map((env) => (
                <TabsContent key={env} value={env}>
                  {byEnv[env].length === 0 ? (
                    <p className="py-6 text-sm text-muted-foreground">
                      No services deployed to {env} in this view.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {byEnv[env].map((row) => (
                        <div
                          key={`${row.service}-${row.provider}-${row.environment}`}
                          className="flex flex-col gap-2 rounded-md border bg-muted/20 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-medium">{row.service}</span>
                            <CloudBadge provider={row.provider} variant="ghost" />
                          </div>
                          <div className="flex items-center justify-between">
                            <DeploymentStatusPill status={row.lastStatus} />
                            <Badge variant={ENV_BADGE[row.environment]} className="capitalize">
                              {row.environment}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-mono">v{row.version}</span>
                            <span>{relativeTime(row.lastDeployedAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent deployments</CardTitle>
            <CardDescription>Across all selected pipelines</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="px-6 py-2 text-left font-medium">Status</th>
                  <th className="px-6 py-2 text-left font-medium">Service</th>
                  <th className="px-6 py-2 text-left font-medium">Cloud</th>
                  <th className="px-6 py-2 text-left font-medium">Env</th>
                  <th className="px-6 py-2 text-left font-medium">Version</th>
                  <th className="px-6 py-2 text-left font-medium">Commit</th>
                  <th className="px-6 py-2 text-left font-medium">Author</th>
                  <th className="px-6 py-2 text-right font-medium">Duration</th>
                  <th className="px-6 py-2 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.recent.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/30">
                    <td className="px-6 py-2.5">
                      <DeploymentStatusPill status={d.status} />
                    </td>
                    <td className="px-6 py-2.5 font-medium">{d.service}</td>
                    <td className="px-6 py-2.5">
                      <CloudBadge provider={d.provider} variant="ghost" />
                    </td>
                    <td className="px-6 py-2.5">
                      <Badge variant={ENV_BADGE[d.environment]} className="capitalize">
                        {d.environment}
                      </Badge>
                    </td>
                    <td className="px-6 py-2.5 font-mono text-xs">v{d.version}</td>
                    <td className="px-6 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <GitCommit className="h-3 w-3" />
                        <code className="font-mono">{d.commitSha}</code>
                        <span className="max-w-[260px] truncate">{d.commitMessage}</span>
                      </div>
                    </td>
                    <td className="px-6 py-2.5 text-xs text-muted-foreground">{d.author}</td>
                    <td className="px-6 py-2.5 text-right text-xs tabular-nums">
                      {d.durationMs ? formatDuration(d.durationMs) : "—"}
                    </td>
                    <td className="px-6 py-2.5 text-right text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {relativeTime(d.startedAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function DoraRow({
  label,
  value,
  tier,
  tierVariant,
}: {
  label: string;
  value: string;
  tier: string;
  tierVariant: "success" | "info" | "warning" | "default";
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{value}</span>
      </div>
      <Badge variant={tierVariant}>{tier}</Badge>
    </div>
  );
}
