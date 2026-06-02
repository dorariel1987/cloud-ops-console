import { PROVIDERS, type ProviderId } from "@/lib/types";

/**
 * Helpers for parsing/normalising the search params used by every dashboard page.
 * All dashboard pages are server components that receive `searchParams` from Next,
 * so we centralise the parsing in a single place.
 */
export interface PageSearchParams {
  providers?: string;
  range?: string;
}

export function parseSearchParams(sp: PageSearchParams) {
  const providers = sp.providers
    ? sp.providers
        .split(",")
        .map((p) => p.trim().toLowerCase())
        .filter((p): p is ProviderId => PROVIDERS.includes(p as ProviderId))
    : undefined;

  const rangeMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const rangeKey = sp.range && rangeMap[sp.range] ? sp.range : "30d";
  const rangeDays = rangeMap[rangeKey] ?? 30;

  return {
    providers: providers && providers.length ? providers : undefined,
    activeProviders: providers && providers.length ? providers : [...PROVIDERS],
    rangeDays,
    rangeKey,
  };
}
