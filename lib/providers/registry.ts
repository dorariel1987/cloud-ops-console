import { PROVIDERS, type ProviderId } from "@/lib/types";
import type {
  CostReport,
  DeploymentReport,
  IncidentReport,
  OverviewSnapshot,
} from "@/lib/types";
import type { CloudProvider } from "@/lib/providers/types";
import { createAwsProvider } from "@/lib/providers/aws";
import { createAzureProvider } from "@/lib/providers/azure";
import { createGcpProvider } from "@/lib/providers/gcp";

const providers: Record<ProviderId, CloudProvider> = {
  aws: createAwsProvider(),
  azure: createAzureProvider(),
  gcp: createGcpProvider(),
};

export function getProvider(id: ProviderId): CloudProvider {
  return providers[id];
}

export function listProviderIds(filter?: ProviderId[]): ProviderId[] {
  if (!filter || filter.length === 0) return [...PROVIDERS];
  return PROVIDERS.filter((p) => filter.includes(p));
}

/**
 * Aggregate the same query across multiple providers and merge the
 * results into a single, unified report. This is what powers the
 * cross-cloud dashboards.
 */
export async function getAggregatedCost(
  rangeDays: number,
  filter?: ProviderId[],
): Promise<CostReport> {
  const ids = listProviderIds(filter);
  const reports = await Promise.all(ids.map((id) => providers[id].getCost(rangeDays)));

  const summaries = reports.flatMap((r) => r.summaries);

  // Merge trend by date - each provider contributes its own column
  const trendMap = new Map<string, { date: string; aws: number; azure: number; gcp: number }>();
  for (const report of reports) {
    for (const point of report.trend) {
      const existing = trendMap.get(point.date) ?? {
        date: point.date,
        aws: 0,
        azure: 0,
        gcp: 0,
      };
      existing.aws += point.aws;
      existing.azure += point.azure;
      existing.gcp += point.gcp;
      trendMap.set(point.date, existing);
    }
  }
  const trend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const topServices = reports
    .flatMap((r) => r.topServices)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 12);

  const anomalies = reports
    .flatMap((r) => r.anomalies)
    .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));

  return { summaries, trend, topServices, anomalies };
}

export async function getAggregatedDeployments(
  rangeDays: number,
  filter?: ProviderId[],
): Promise<DeploymentReport> {
  const ids = listProviderIds(filter);
  const reports = await Promise.all(
    ids.map((id) => providers[id].getDeployments(rangeDays)),
  );

  const totalLast24h = reports.reduce((s, r) => s + r.metrics.totalLast24h, 0);
  const successAvg =
    reports.reduce((s, r) => s + r.metrics.successRatePct, 0) / Math.max(reports.length, 1);
  const failureAvg =
    reports.reduce((s, r) => s + r.metrics.failureRatePct, 0) / Math.max(reports.length, 1);
  const durationAvg =
    reports.reduce((s, r) => s + r.metrics.avgDurationMs, 0) / Math.max(reports.length, 1);
  const leadAvg =
    reports.reduce((s, r) => s + r.metrics.leadTimeMs, 0) / Math.max(reports.length, 1);
  const cfrAvg =
    reports.reduce((s, r) => s + r.metrics.changeFailureRatePct, 0) / Math.max(reports.length, 1);
  const mttrAvg =
    reports.reduce((s, r) => s + r.metrics.mttrMs, 0) / Math.max(reports.length, 1);

  return {
    metrics: {
      totalLast24h,
      successRatePct: Number(successAvg.toFixed(1)),
      failureRatePct: Number(failureAvg.toFixed(1)),
      avgDurationMs: Math.round(durationAvg),
      leadTimeMs: Math.round(leadAvg),
      changeFailureRatePct: Number(cfrAvg.toFixed(1)),
      mttrMs: Math.round(mttrAvg),
    },
    recent: reports
      .flatMap((r) => r.recent)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, 25),
    byService: reports.flatMap((r) => r.byService),
  };
}

export async function getAggregatedIncidents(
  rangeDays: number,
  filter?: ProviderId[],
): Promise<IncidentReport> {
  const ids = listProviderIds(filter);
  const reports = await Promise.all(
    ids.map((id) => providers[id].getIncidents(rangeDays)),
  );

  const open = reports.reduce((s, r) => s + r.metrics.open, 0);
  const openSev1 = reports.reduce((s, r) => s + r.metrics.openSev1, 0);
  const openSev2 = reports.reduce((s, r) => s + r.metrics.openSev2, 0);
  const last7DaysCount = reports.reduce((s, r) => s + r.metrics.last7DaysCount, 0);
  const ackAvg =
    reports.reduce((s, r) => s + r.metrics.acknowledgedRatePct, 0) /
    Math.max(reports.length, 1);
  const mttaAvg =
    reports.reduce((s, r) => s + r.metrics.mttaMs, 0) / Math.max(reports.length, 1);
  const mttrAvg =
    reports.reduce((s, r) => s + r.metrics.mttrMs, 0) / Math.max(reports.length, 1);

  return {
    metrics: {
      open,
      openSev1,
      openSev2,
      acknowledgedRatePct: Number(ackAvg.toFixed(1)),
      mttaMs: Math.round(mttaAvg),
      mttrMs: Math.round(mttrAvg),
      last7DaysCount,
    },
    active: reports
      .flatMap((r) => r.active)
      .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt)),
    recentResolved: reports
      .flatMap((r) => r.recentResolved)
      .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))
      .slice(0, 15),
    onCall: reports.flatMap((r) => r.onCall),
  };
}

export async function getOverview(filter?: ProviderId[]): Promise<OverviewSnapshot> {
  const [cost, deployments, incidents] = await Promise.all([
    getAggregatedCost(30, filter),
    getAggregatedDeployments(7, filter),
    getAggregatedIncidents(7, filter),
  ]);

  const monthToDate = cost.summaries.reduce((s, c) => s + c.currentMonth, 0);
  const forecast = cost.summaries.reduce((s, c) => s + c.forecast, 0);
  const previous = cost.summaries.reduce((s, c) => s + c.previousMonth, 0);
  const changePct = previous ? ((forecast - previous) / previous) * 100 : 0;

  const byProvider = { aws: 0, azure: 0, gcp: 0 } as Record<ProviderId, number>;
  for (const s of cost.summaries) byProvider[s.provider] = s.currentMonth;

  return {
    cost: {
      monthToDate,
      forecast,
      changePct: Number(changePct.toFixed(1)),
      byProvider,
      anomaliesCount: cost.anomalies.length,
    },
    deployments: {
      last24h: deployments.metrics.totalLast24h,
      successRatePct: deployments.metrics.successRatePct,
      failures: deployments.recent.filter(
        (d) => d.status === "failed" || d.status === "rolled_back",
      ).length,
      inFlight: deployments.recent.filter(
        (d) => d.status === "running" || d.status === "queued",
      ).length,
    },
    incidents: {
      open: incidents.metrics.open,
      sev1: incidents.metrics.openSev1,
      sev2: incidents.metrics.openSev2,
      mttrMs: incidents.metrics.mttrMs,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function parseProviderFilter(value: string | null | undefined): ProviderId[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is ProviderId => PROVIDERS.includes(p as ProviderId));
  return parts.length ? parts : undefined;
}

export function parseRangeDays(value: string | null | undefined): number {
  if (!value) return 30;
  const map: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  return map[value] ?? (Number(value) || 30);
}
