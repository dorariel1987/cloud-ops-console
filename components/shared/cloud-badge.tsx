import { PROVIDER_META, type ProviderId } from "@/lib/types";
import { ProviderLogo } from "@/components/shared/provider-logo";
import { cn } from "@/lib/utils";

interface CloudBadgeProps {
  provider: ProviderId;
  className?: string;
  variant?: "soft" | "ghost";
}

const PROVIDER_BG: Record<ProviderId, string> = {
  aws: "bg-aws/10 text-aws",
  azure: "bg-azure/10 text-azure",
  gcp: "bg-gcp/10 text-gcp",
};

export function CloudBadge({ provider, className, variant = "soft" }: CloudBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        variant === "soft" ? PROVIDER_BG[provider] : "text-muted-foreground",
        className,
      )}
    >
      <ProviderLogo provider={provider} size={12} />
      <span>{PROVIDER_META[provider].shortName}</span>
    </div>
  );
}
