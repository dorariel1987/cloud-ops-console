import type { ProviderId } from "@/lib/types";

export const SERVICES: Record<ProviderId, string[]> = {
  aws: [
    "EC2",
    "S3",
    "RDS Aurora",
    "Lambda",
    "EKS",
    "CloudFront",
    "DynamoDB",
    "OpenSearch",
    "MSK",
    "ElastiCache",
  ],
  azure: [
    "Virtual Machines",
    "Blob Storage",
    "Azure SQL",
    "Functions",
    "AKS",
    "Front Door",
    "Cosmos DB",
    "Service Bus",
    "Synapse",
    "App Service",
  ],
  gcp: [
    "Compute Engine",
    "Cloud Storage",
    "Cloud SQL",
    "Cloud Run",
    "GKE",
    "Cloud CDN",
    "BigQuery",
    "Pub/Sub",
    "Spanner",
    "Memorystore",
  ],
};

export const REGIONS: Record<ProviderId, string[]> = {
  aws: ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"],
  azure: ["eastus", "westeurope", "northeurope", "southeastasia"],
  gcp: ["us-central1", "us-east1", "europe-west1", "asia-southeast1"],
};

export const PIPELINES: Record<ProviderId, string[]> = {
  aws: ["CodePipeline-prod", "CodePipeline-staging", "CodePipeline-canary"],
  azure: ["azure-pipelines-prod", "azure-pipelines-staging"],
  gcp: ["cloudbuild-prod", "cloudbuild-staging"],
};

export const SERVICE_PROVIDER_MAP: Array<{
  service: string;
  provider: ProviderId;
}> = [
  { service: "checkout-api", provider: "aws" },
  { service: "checkout-api", provider: "azure" },
  { service: "search-api", provider: "aws" },
  { service: "recommendations", provider: "gcp" },
  { service: "auth-service", provider: "aws" },
  { service: "billing-worker", provider: "azure" },
  { service: "media-encoder", provider: "gcp" },
  { service: "notification-svc", provider: "aws" },
  { service: "data-pipeline", provider: "gcp" },
  { service: "admin-portal", provider: "azure" },
  { service: "edge-cache", provider: "aws" },
  { service: "ml-inference", provider: "gcp" },
  { service: "reports-api", provider: "azure" },
];

export const TEAM_MEMBERS = [
  { name: "Maya Cohen", email: "maya.c@example.com", color: "#f97316", tz: "Asia/Jerusalem" },
  { name: "Daniel Park", email: "daniel.p@example.com", color: "#06b6d4", tz: "America/Los_Angeles" },
  { name: "Priya Sharma", email: "priya.s@example.com", color: "#a855f7", tz: "Asia/Kolkata" },
  { name: "Lukas Werner", email: "lukas.w@example.com", color: "#22c55e", tz: "Europe/Berlin" },
  { name: "Sofia Alvarez", email: "sofia.a@example.com", color: "#ef4444", tz: "America/Sao_Paulo" },
  { name: "Kenji Tanaka", email: "kenji.t@example.com", color: "#3b82f6", tz: "Asia/Tokyo" },
  { name: "Amelia Brown", email: "amelia.b@example.com", color: "#eab308", tz: "Europe/London" },
  { name: "Omar Khalil", email: "omar.k@example.com", color: "#ec4899", tz: "Africa/Cairo" },
];

export const COMMIT_MESSAGES = [
  "fix(checkout): handle null currency in tax calc",
  "feat(search): add fuzzy matching with typo tolerance",
  "chore(deps): bump aws-sdk to 3.700.0",
  "perf(api): cache user permissions for 60s",
  "fix(auth): rotate JWT signing key on schedule",
  "feat(billing): support partial refunds via webhook",
  "refactor(worker): extract retry policy to shared lib",
  "fix(infra): increase RDS max connections",
  "feat(ml): roll out v3 ranking model to 10%",
  "fix(cdn): purge cache on locale switch",
  "feat(reports): add CSV export endpoint",
  "fix(ws): reconnect with exponential backoff",
  "chore(ci): cache docker layers in build pipeline",
  "feat(admin): bulk-suspend abusive accounts",
  "fix(payments): retry 3DS on transient failure",
];

export const AUTHORS = [
  "maya.c",
  "daniel.p",
  "priya.s",
  "lukas.w",
  "sofia.a",
  "kenji.t",
  "amelia.b",
  "omar.k",
];
