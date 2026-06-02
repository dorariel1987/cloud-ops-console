import type { CloudProvider } from "@/lib/providers/types";
import { createMockProvider } from "@/lib/providers/mock";

/**
 * Real Azure adapter.
 *
 * To implement, replace the delegation below with calls to:
 *
 *   - getCost: @azure/arm-costmanagement
 *       client.query.usage(scope, { type: "Usage", timeframe: "MonthToDate", ... })
 *
 *   - getDeployments: azure-devops-node-api
 *       buildApi.getBuilds(project, ...) / releaseApi.getReleases(...)
 *
 *   - getIncidents: @azure/arm-monitor
 *       client.activeAlerts.getAll(...)
 *
 * Auth: ClientSecretCredential / DefaultAzureCredential from @azure/identity.
 */
export function createAzureProvider(): CloudProvider {
  if (process.env.DATA_SOURCE === "live") {
    // TODO(real-azure): Wire @azure/* clients here.
  }
  return createMockProvider("azure");
}
