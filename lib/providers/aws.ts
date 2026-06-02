import type { CloudProvider } from "@/lib/providers/types";
import { createMockProvider } from "@/lib/providers/mock";

/**
 * Real AWS adapter.
 *
 * To implement, replace the `createMockProvider("aws")` delegation below
 * with calls to the AWS SDK v3:
 *
 *   - getCost: @aws-sdk/client-cost-explorer
 *       new GetCostAndUsageCommand({
 *         TimePeriod: { Start, End },
 *         Granularity: "DAILY",
 *         Metrics: ["UnblendedCost"],
 *         GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
 *       })
 *
 *   - getDeployments: @aws-sdk/client-codepipeline
 *       new ListPipelineExecutionsCommand({ pipelineName })
 *
 *   - getIncidents: @aws-sdk/client-cloudwatch
 *       new DescribeAlarmsCommand({ StateValue: "ALARM" })
 *
 * Credentials are read from the standard AWS_* env vars (see .env.example).
 */
export function createAwsProvider(): CloudProvider {
  if (process.env.DATA_SOURCE === "live") {
    // TODO(real-aws): Wire @aws-sdk/* clients here and remove this fallback.
    // Until then we fall through to mock so the dashboard remains functional.
  }
  return createMockProvider("aws");
}
