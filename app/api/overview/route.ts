import { NextResponse } from "next/server";
import { getOverview, parseProviderFilter } from "@/lib/providers/registry";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const providers = parseProviderFilter(url.searchParams.get("providers"));
  const data = await getOverview(providers);
  return NextResponse.json(data);
}
