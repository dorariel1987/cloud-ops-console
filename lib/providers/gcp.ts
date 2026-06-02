import type { CloudProvider } from "@/lib/providers/types";
import { createMockProvider } from "@/lib/providers/mock";

/**
 * Real GCP adapter.
 *
 * To implement, replace the delegation below with calls to:
 *
 *   - getCost: @google-cloud/billing  (or query the BigQuery billing export
 *     table which is the recommended path for granular spend analysis).
 *
 *   - getDeployments: @google-cloud/cloudbuild
 *       client.listBuilds({ projectId, filter: 'create_time>="..."' })
 *
 *   - getIncidents: @google-cloud/monitoring
 *       client.listAlertPolicies({ name }) +
 *       client.listIncidents({ name, filter: 'state="open"' })
 *
 * Auth: GOOGLE_APPLICATION_CREDENTIALS pointing at a service-account JSON.
 */
export function createGcpProvider(): CloudProvider {
  if (process.env.DATA_SOURCE === "live") {
    // TODO(real-gcp): Wire @google-cloud/* clients here.
  }
  return createMockProvider("gcp");
}
