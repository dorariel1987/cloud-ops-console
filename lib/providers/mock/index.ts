import type {
  CostAnomaly,
  CostReport,
  CostSummary,
  Deployment,
  DeploymentReport,
  DeploymentStatus,
  Environment,
  Incident,
  IncidentReport,
  IncidentSeverity,
  IncidentStatus,
  OnCallShift,
  ProviderId,
  ServiceCost,
} from "@/lib/types";
import type { CloudProvider } from "@/lib/providers/types";
import {
  AUTHORS,
  COMMIT_MESSAGES,
  PIPELINES,
  REGIONS,
  SERVICE_PROVIDER_MAP,
  SERVICES,
  TEAM_MEMBERS,
} from "@/lib/providers/mock/catalog";
import { intRange, pick, range, rng, type RNG } from "@/lib/providers/mock/seed";

/**
 * Each provider gets a different deterministic seed so that AWS/Azure/GCP
 * exhibit visibly different cost & traffic profiles.
 */
const SEEDS: Record<ProviderId, number> = {
  aws: 0xa1bcdef1,
  azure: 0x5fa11e0d,
  gcp: 0xc1ea2c0d,
};

const PROFILES: Record<
  ProviderId,
  { baseDailyCost: number; volatility: number; weekendDropPct: number }
> = {
  aws: { baseDailyCost: 14_500, volatility: 0.08, weekendDropPct: 0.18 },
  azure: { baseDailyCost: 9_200, volatility: 0.06, weekendDropPct: 0.22 },
  gcp: { baseDailyCost: 7_800, volatility: 0.1, weekendDropPct: 0.25 },
};

const BUDGETS: Record<ProviderId, number> = {
  aws: 480_000,
  azure: 310_000,
  gcp: 260_000,
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function shortSha(r: RNG) {
  let sha = "";
  while (sha.length < 7) sha += Math.floor(r() * 16).toString(16);
  return sha;
}

function uuid(r: RNG, prefix = "") {
  let s = prefix;
  for (let i = 0; i < 8; i++) s += Math.floor(r() * 16).toString(16);
  return s;
}

// ------------------------------------------------------------------
// Cost
// ------------------------------------------------------------------

function buildCostTrend(provider: ProviderId, days: number) {
  const r = rng(SEEDS[provider] ^ days);
  const profile = PROFILES[provider];
  const points: Array<{ date: string; amount: number }> = [];
  const today = new Date();

  // Long, slight upward growth + weekly seasonality + occasional anomaly.
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dow = d.getDay();
    const weekend = dow === 0 || dow === 6;

    const trendFactor = 1 + (days - i) * 0.0015; // ~0.15% growth per day
    const noise = 1 + (r() - 0.5) * profile.volatility * 2;
    const weekendFactor = weekend ? 1 - profile.weekendDropPct : 1;

    let amount = profile.baseDailyCost * trendFactor * noise * weekendFactor;

    // Inject a single visible anomaly mid-range so charts look alive.
    if (i === Math.floor(days * 0.35)) amount *= 1.45;

    points.push({ date: isoDate(d), amount: Math.round(amount) });
  }
  return points;
}

function buildCostSummary(provider: ProviderId, trend: { date: string; amount: number }[]): CostSummary {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const inRange = (iso: string, start: Date, end: Date) => {
    const t = new Date(iso).getTime();
    return t >= start.getTime() && t <= end.getTime();
  };

  const currentMonth = trend
    .filter((p) => inRange(p.date, monthStart, now))
    .reduce((s, p) => s + p.amount, 0);
  const previousMonth = trend
    .filter((p) => inRange(p.date, prevMonthStart, prevMonthEnd))
    .reduce((s, p) => s + p.amount, 0) || PROFILES[provider].baseDailyCost * 30;

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const dailyAvg = currentMonth / Math.max(dayOfMonth, 1);
  const forecast = Math.round(dailyAvg * daysInMonth);
  const changePct = previousMonth ? ((forecast - previousMonth) / previousMonth) * 100 : 0;
  const budget = BUDGETS[provider];

  return {
    provider,
    currentMonth: Math.round(currentMonth),
    previousMonth: Math.round(previousMonth),
    forecast,
    changePct: Number(changePct.toFixed(1)),
    budget,
    budgetUsedPct: Number(((forecast / budget) * 100).toFixed(1)),
  };
}

function buildTopServices(provider: ProviderId): ServiceCost[] {
  const r = rng(SEEDS[provider] ^ 0xa11f);
  return SERVICES[provider].map((service) => {
    const amount = Math.round(range(r, 4_000, 95_000));
    const changePct = Number(range(r, -18, 24).toFixed(1));
    return { service, provider, amount, changePct };
  });
}

function buildAnomalies(provider: ProviderId): CostAnomaly[] {
  const r = rng(SEEDS[provider] ^ 0xbeef);
  const count = intRange(r, 1, 3);
  const out: CostAnomaly[] = [];
  for (let i = 0; i < count; i++) {
    const service = pick(r, SERVICES[provider]);
    const expected = Math.round(range(r, 800, 6_000));
    const actual = Math.round(expected * range(r, 1.4, 2.8));
    const deltaPct = Number((((actual - expected) / expected) * 100).toFixed(1));
    const detectedAt = new Date(Date.now() - intRange(r, 1, 72) * 3_600_000).toISOString();
    out.push({
      id: uuid(r, "an_"),
      provider,
      service,
      detectedAt,
      expected,
      actual,
      deltaPct,
      description: `Spend on ${service} is ${deltaPct.toFixed(0)}% above the 30-day baseline.`,
    });
  }
  return out;
}

async function getCost(provider: ProviderId, rangeDays: number): Promise<CostReport> {
  const trend = buildCostTrend(provider, rangeDays);
  return {
    summaries: [buildCostSummary(provider, trend)],
    trend: trend.map((p) => ({
      date: p.date,
      aws: provider === "aws" ? p.amount : 0,
      azure: provider === "azure" ? p.amount : 0,
      gcp: provider === "gcp" ? p.amount : 0,
    })),
    topServices: buildTopServices(provider).sort((a, b) => b.amount - a.amount),
    anomalies: buildAnomalies(provider),
  };
}

// ------------------------------------------------------------------
// Deployments
// ------------------------------------------------------------------

const STATUS_DISTRIBUTION: DeploymentStatus[] = [
  "succeeded", "succeeded", "succeeded", "succeeded", "succeeded",
  "succeeded", "succeeded", "succeeded", "running",
  "failed", "rolled_back", "queued",
];

const ENV_DISTRIBUTION: Environment[] = [
  "production", "production", "staging", "staging", "staging", "dev", "dev", "dev",
];

function buildDeployments(provider: ProviderId, count: number, includeOlder: boolean): Deployment[] {
  const r = rng(SEEDS[provider] ^ 0xd3915);
  const services = SERVICE_PROVIDER_MAP.filter((s) => s.provider === provider).map((s) => s.service);
  const list: Deployment[] = [];
  for (let i = 0; i < count; i++) {
    const status = pick(r, STATUS_DISTRIBUTION);
    const env = pick(r, ENV_DISTRIBUTION);
    const startedAt = new Date(
      Date.now() - intRange(r, 1, includeOlder ? 60 * 24 : 24) * 60 * 60 * 1000,
    );
    const durationMs = status === "queued" || status === "running"
      ? undefined
      : intRange(r, 45_000, 14 * 60 * 1000);
    const finishedAt = durationMs
      ? new Date(startedAt.getTime() + durationMs).toISOString()
      : undefined;

    list.push({
      id: uuid(r, "dep_"),
      service: services.length ? pick(r, services) : pick(r, SERVICES[provider]),
      provider,
      environment: env,
      status,
      version: `${intRange(r, 1, 9)}.${intRange(r, 0, 30)}.${intRange(r, 0, 99)}`,
      commitSha: shortSha(r),
      commitMessage: pick(r, COMMIT_MESSAGES),
      author: pick(r, AUTHORS),
      startedAt: startedAt.toISOString(),
      finishedAt,
      durationMs,
      pipeline: pick(r, PIPELINES[provider]),
      region: pick(r, REGIONS[provider]),
    });
  }
  return list.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

async function getDeployments(provider: ProviderId, rangeDays: number): Promise<DeploymentReport> {
  const all = buildDeployments(provider, Math.max(40, rangeDays * 4), rangeDays > 7);
  const last24h = all.filter(
    (d) => Date.now() - new Date(d.startedAt).getTime() < 24 * 60 * 60 * 1000,
  );
  const succeeded = all.filter((d) => d.status === "succeeded");
  const failed = all.filter((d) => d.status === "failed" || d.status === "rolled_back");
  const completed = all.filter((d) => d.durationMs);

  const avgDurationMs = completed.length
    ? Math.round(completed.reduce((s, d) => s + (d.durationMs ?? 0), 0) / completed.length)
    : 0;

  // byService: latest deployment per (service, env) pair
  const latestKey = new Map<string, Deployment>();
  for (const d of all) {
    const k = `${d.service}::${d.environment}`;
    if (!latestKey.has(k)) latestKey.set(k, d);
  }

  return {
    metrics: {
      totalLast24h: last24h.length,
      successRatePct: Number(((succeeded.length / Math.max(all.length, 1)) * 100).toFixed(1)),
      failureRatePct: Number(((failed.length / Math.max(all.length, 1)) * 100).toFixed(1)),
      avgDurationMs,
      leadTimeMs: avgDurationMs * 6, // rough proxy
      changeFailureRatePct: Number(((failed.length / Math.max(all.length, 1)) * 100).toFixed(1)),
      mttrMs: 35 * 60 * 1000,
    },
    recent: all.slice(0, 20),
    byService: Array.from(latestKey.values()).map((d) => ({
      service: d.service,
      provider: d.provider,
      environment: d.environment,
      lastStatus: d.status,
      lastDeployedAt: d.startedAt,
      version: d.version,
    })),
  };
}

// ------------------------------------------------------------------
// Incidents & On-Call
// ------------------------------------------------------------------

const SEVERITY_DISTRIBUTION: IncidentSeverity[] = [
  "sev3", "sev3", "sev3", "sev2", "sev2", "sev4", "sev4", "sev1",
];

const STATUS_BY_AGE = (ageMin: number): IncidentStatus => {
  if (ageMin < 5) return "triggered";
  if (ageMin < 30) return "acknowledged";
  if (ageMin < 90) return "investigating";
  return "resolved";
};

const SOURCES: Record<ProviderId, string[]> = {
  aws: ["CloudWatch", "GuardDuty", "AWS Health"],
  azure: ["Azure Monitor", "Application Insights", "Defender"],
  gcp: ["Cloud Monitoring", "Error Reporting", "Security Center"],
};

const INCIDENT_TITLES = [
  "API p95 latency above SLO",
  "Elevated 5xx rate",
  "Database CPU sustained above 90%",
  "Queue backlog growing",
  "Out of memory on worker pod",
  "TLS certificate expiring soon",
  "Disk usage above 85%",
  "Replication lag exceeded threshold",
  "Auth service rejecting tokens",
  "Object storage 4xx surge",
];

function buildIncidents(provider: ProviderId, rangeDays: number): Incident[] {
  const r = rng(SEEDS[provider] ^ 0x10c1d);
  const list: Incident[] = [];
  // active (within last 4h) + resolved (within rangeDays)
  const totalActive = intRange(r, 2, 5);
  const totalResolved = intRange(r, 8, 14);

  for (let i = 0; i < totalActive; i++) {
    const triggered = new Date(Date.now() - intRange(r, 1, 240) * 60_000);
    const ageMin = (Date.now() - triggered.getTime()) / 60_000;
    const status = STATUS_BY_AGE(ageMin);
    const ack = status !== "triggered"
      ? new Date(triggered.getTime() + intRange(r, 30, 480) * 1000).toISOString()
      : undefined;

    list.push({
      id: uuid(r, "inc_"),
      title: pick(r, INCIDENT_TITLES),
      provider,
      service: pick(r, SERVICES[provider]),
      severity: pick(r, SEVERITY_DISTRIBUTION),
      status: status === "resolved" ? "investigating" : status,
      triggeredAt: triggered.toISOString(),
      acknowledgedAt: ack,
      assignee: pick(r, TEAM_MEMBERS).name,
      description: "Auto-detected by metric alarm; runbook attached in PagerDuty.",
      source: pick(r, SOURCES[provider]),
    });
  }

  for (let i = 0; i < totalResolved; i++) {
    const triggered = new Date(Date.now() - intRange(r, 1, rangeDays * 24) * 60 * 60_000);
    const ackOffset = intRange(r, 30, 600) * 1000;
    const resolveOffset = ackOffset + intRange(r, 300, 7200) * 1000;
    list.push({
      id: uuid(r, "inc_"),
      title: pick(r, INCIDENT_TITLES),
      provider,
      service: pick(r, SERVICES[provider]),
      severity: pick(r, SEVERITY_DISTRIBUTION),
      status: "resolved",
      triggeredAt: triggered.toISOString(),
      acknowledgedAt: new Date(triggered.getTime() + ackOffset).toISOString(),
      resolvedAt: new Date(triggered.getTime() + resolveOffset).toISOString(),
      assignee: pick(r, TEAM_MEMBERS).name,
      description: "Resolved automatically when metric returned below threshold.",
      source: pick(r, SOURCES[provider]),
    });
  }

  return list.sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt));
}

function buildOnCall(provider: ProviderId): OnCallShift[] {
  const r = rng(SEEDS[provider] ^ 0x07ca11);
  const teams: Record<ProviderId, string[]> = {
    aws: ["Platform", "Payments"],
    azure: ["Identity", "Data"],
    gcp: ["ML", "Edge"],
  };
  const now = new Date();
  return teams[provider].map((team, i) => {
    const startsAt = new Date(now);
    startsAt.setHours(now.getHours() - intRange(r, 1, 5));
    const endsAt = new Date(startsAt);
    endsAt.setHours(endsAt.getHours() + 24);
    const primary = TEAM_MEMBERS[(i + provider.length) % TEAM_MEMBERS.length];
    const secondary = TEAM_MEMBERS[(i + provider.length + 3) % TEAM_MEMBERS.length];
    return {
      id: uuid(r, "shift_"),
      team: `${team} (${provider.toUpperCase()})`,
      primary: { name: primary.name, email: primary.email, avatarColor: primary.color, timezone: primary.tz },
      secondary: { name: secondary.name, email: secondary.email, avatarColor: secondary.color, timezone: secondary.tz },
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      schedule: "Follow-the-sun · 24h rotation",
    };
  });
}

async function getIncidents(provider: ProviderId, rangeDays: number): Promise<IncidentReport> {
  const all = buildIncidents(provider, rangeDays);
  const active = all.filter((i) => i.status !== "resolved");
  const recentResolved = all.filter((i) => i.status === "resolved").slice(0, 12);

  const ackTimes = all
    .filter((i) => i.acknowledgedAt)
    .map((i) => new Date(i.acknowledgedAt!).getTime() - new Date(i.triggeredAt).getTime());
  const resolveTimes = all
    .filter((i) => i.resolvedAt)
    .map((i) => new Date(i.resolvedAt!).getTime() - new Date(i.triggeredAt).getTime());

  const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0);

  return {
    metrics: {
      open: active.length,
      openSev1: active.filter((i) => i.severity === "sev1").length,
      openSev2: active.filter((i) => i.severity === "sev2").length,
      acknowledgedRatePct: Number(((ackTimes.length / Math.max(all.length, 1)) * 100).toFixed(1)),
      mttaMs: mean(ackTimes),
      mttrMs: mean(resolveTimes),
      last7DaysCount: all.filter(
        (i) => Date.now() - new Date(i.triggeredAt).getTime() < 7 * 24 * 60 * 60 * 1000,
      ).length,
    },
    active,
    recentResolved,
    onCall: buildOnCall(provider),
  };
}

// ------------------------------------------------------------------
// Adapter factory
// ------------------------------------------------------------------

export function createMockProvider(id: ProviderId): CloudProvider {
  return {
    id,
    getCost: (rangeDays) => getCost(id, rangeDays),
    getDeployments: (rangeDays) => getDeployments(id, rangeDays),
    getIncidents: (rangeDays) => getIncidents(id, rangeDays),
  };
}
