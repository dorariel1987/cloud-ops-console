import { NextResponse } from "next/server";
import {
  getAggregatedCost,
  parseProviderFilter,
  parseRangeDays,
} from "@/lib/providers/registry";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const providers = parseProviderFilter(url.searchParams.get("providers"));
  const rangeDays = parseRangeDays(url.searchParams.get("range"));
  const data = await getAggregatedCost(rangeDays, providers);
  return NextResponse.json(data);
}
