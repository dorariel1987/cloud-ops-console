import type {
  CostReport,
  DeploymentReport,
  IncidentReport,
  ProviderId,
} from "@/lib/types";

/**
 * The CloudProvider interface is the single integration seam between
 * the application and any cloud-specific SDK.
 *
 * The mock adapter (lib/providers/mock) is the default implementation
 * used during development. Real adapters (lib/providers/aws | azure | gcp)
 * implement the same surface area on top of:
 *
 *   - AWS: Cost Explorer, CodePipeline, CloudWatch Alarms
 *   - Azure: Cost Management, Azure Pipelines, Azure Monitor
 *   - GCP: Cloud Billing, Cloud Build, Cloud Monitoring
 *
 * All methods accept an optional time range expressed in days,
 * and must return data for *only* this provider. Aggregation across
 * providers is handled by the registry.
 */
export interface CloudProvider {
  readonly id: ProviderId;
  getCost(rangeDays: number): Promise<CostReport>;
  getDeployments(rangeDays: number): Promise<DeploymentReport>;
  getIncidents(rangeDays: number): Promise<IncidentReport>;
}
