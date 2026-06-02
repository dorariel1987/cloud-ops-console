/**
 * Domain types shared across the Cloud Ops Console.
 *
 * The same shapes are produced by every CloudProvider implementation
 * (mock + real AWS/Azure/GCP adapters), so consumers do not need to
 * know which backend the data came from.
 */

export type ProviderId = "aws" | "azure" | "gcp";

export const PROVIDERS: ProviderId[] = ["aws", "azure", "gcp"];

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  shortName: string;
}

export const PROVIDER_META: Record<ProviderId, ProviderMeta> = {
  aws: { id: "aws", name: "Amazon Web Services", shortName: "AWS" },
  azure: { id: "azure", name: "Microsoft Azure", shortName: "Azure" },
  gcp: { id: "gcp", name: "Google Cloud Platform", shortName: "GCP" },
};

// ---------- Cost ----------

export interface CostPoint {
  date: string; // ISO date (YYYY-MM-DD)
  amount: number; // USD
}

export interface ServiceCost {
  service: string;
  provider: ProviderId;
  amount: number;
  changePct: number; // vs previous period
}

export interface CostAnomaly {
  id: string;
  provider: ProviderId;
  service: string;
  detectedAt: string; // ISO datetime
  expected: number;
  actual: number;
  deltaPct: number;
  description: string;
}

export interface CostSummary {
  provider: ProviderId;
  currentMonth: number;
  previousMonth: number;
  forecast: number;
  changePct: number;
  budget?: number;
  budgetUsedPct?: number;
}

export interface CostReport {
  summaries: CostSummary[];
  trend: Array<{ date: string } & Record<ProviderId, number>>;
  topServices: ServiceCost[];
  anomalies: CostAnomaly[];
}

// ---------- Deployments ----------

export type DeploymentStatus =
  | "succeeded"
  | "running"
  | "failed"
  | "rolled_back"
  | "queued";

export type Environment = "production" | "staging" | "dev";

export interface Deployment {
  id: string;
  service: string;
  provider: ProviderId;
  environment: Environment;
  status: DeploymentStatus;
  version: string;
  commitSha: string;
  commitMessage: string;
  author: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  pipeline: string;
  region: string;
}

export interface DeploymentMetrics {
  totalLast24h: number;
  successRatePct: number;
  failureRatePct: number;
  avgDurationMs: number;
  leadTimeMs: number;
  changeFailureRatePct: number;
  mttrMs: number;
}

export interface DeploymentReport {
  metrics: DeploymentMetrics;
  recent: Deployment[];
  byService: Array<{
    service: string;
    provider: ProviderId;
    environment: Environment;
    lastStatus: DeploymentStatus;
    lastDeployedAt: string;
    version: string;
  }>;
}

// ---------- Incidents & On-Call ----------

export type IncidentSeverity = "sev1" | "sev2" | "sev3" | "sev4";
export type IncidentStatus = "triggered" | "acknowledged" | "investigating" | "resolved";

export interface Incident {
  id: string;
  title: string;
  provider: ProviderId;
  service: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  assignee?: string;
  description: string;
  source: string; // e.g. "CloudWatch", "Azure Monitor", "Stackdriver"
}

export interface OnCallShift {
  id: string;
  team: string;
  primary: OnCallPerson;
  secondary?: OnCallPerson;
  startsAt: string;
  endsAt: string;
  schedule: string;
}

export interface OnCallPerson {
  name: string;
  email: string;
  avatarColor: string;
  timezone: string;
}

export interface IncidentMetrics {
  open: number;
  openSev1: number;
  openSev2: number;
  acknowledgedRatePct: number;
  mttaMs: number; // mean time to acknowledge
  mttrMs: number; // mean time to resolve
  last7DaysCount: number;
}

export interface IncidentReport {
  metrics: IncidentMetrics;
  active: Incident[];
  recentResolved: Incident[];
  onCall: OnCallShift[];
}

// ---------- Overview ----------

export interface OverviewSnapshot {
  cost: {
    monthToDate: number;
    forecast: number;
    changePct: number;
    byProvider: Record<ProviderId, number>;
    anomaliesCount: number;
  };
  deployments: {
    last24h: number;
    successRatePct: number;
    failures: number;
    inFlight: number;
  };
  incidents: {
    open: number;
    sev1: number;
    sev2: number;
    mttrMs: number;
  };
  generatedAt: string;
}

// ---------- Filters ----------

export interface CloudFilter {
  providers?: ProviderId[];
  range?: "7d" | "30d" | "90d";
}
