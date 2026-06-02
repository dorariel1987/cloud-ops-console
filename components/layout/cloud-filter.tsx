"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter, ChevronDown } from "lucide-react";
import { PROVIDER_META, PROVIDERS, type ProviderId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ProviderLogo } from "@/components/shared/provider-logo";

const RANGES: Array<{ value: "7d" | "30d" | "90d"; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export function CloudFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const selectedProviders = React.useMemo<ProviderId[]>(() => {
    const raw = params.get("providers");
    if (!raw) return [...PROVIDERS];
    return raw
      .split(",")
      .filter((p): p is ProviderId => PROVIDERS.includes(p as ProviderId));
  }, [params]);

  const selectedRange = (params.get("range") as "7d" | "30d" | "90d") ?? "30d";

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    router.push(`${pathname}?${next.toString()}`);
  };

  const toggleProvider = (id: ProviderId) => {
    const has = selectedProviders.includes(id);
    const next = has
      ? selectedProviders.filter((p) => p !== id)
      : [...selectedProviders, id];
    if (next.length === 0 || next.length === PROVIDERS.length) {
      updateParams({ providers: null });
    } else {
      updateParams({ providers: next.join(",") });
    }
  };

  const allSelected = selectedProviders.length === PROVIDERS.length;
  const providerLabel = allSelected
    ? "All clouds"
    : selectedProviders.map((p) => PROVIDER_META[p].shortName).join(" + ") || "None";

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{providerLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Cloud providers</DropdownMenuLabel>
          {PROVIDERS.map((id) => (
            <DropdownMenuCheckboxItem
              key={id}
              checked={selectedProviders.includes(id)}
              onCheckedChange={() => toggleProvider(id)}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="flex items-center gap-2">
                <ProviderLogo provider={id} size={14} />
                {PROVIDER_META[id].name}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => updateParams({ providers: null })}
            className="justify-center text-xs"
          >
            Reset to all
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            {RANGES.find((r) => r.value === selectedRange)?.label ?? "Range"}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Time range</DropdownMenuLabel>
          {RANGES.map((r) => (
            <DropdownMenuItem
              key={r.value}
              onSelect={() =>
                updateParams({ range: r.value === "30d" ? null : r.value })
              }
            >
              {r.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
