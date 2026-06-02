import type { ProviderId } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProviderLogoProps {
  provider: ProviderId;
  className?: string;
  size?: number;
}

/**
 * Tiny inline SVG marks for each cloud provider.
 * Stylized — not the official logos — so we never trip trademark issues.
 */
export function ProviderLogo({ provider, className, size = 18 }: ProviderLogoProps) {
  const dim = { width: size, height: size };
  if (provider === "aws") {
    return (
      <svg viewBox="0 0 32 32" className={cn("text-aws", className)} {...dim}>
        <path
          fill="currentColor"
          d="M9 18.5c0 .9.1 1.6.3 2.1.2.5.5 1 .9 1.5.1.1.2.3.2.4 0 .2-.1.3-.3.5l-.9.6c-.1.1-.3.1-.4.1-.2 0-.3-.1-.5-.2-.6-.7-1.2-1.5-1.5-2.4C5.6 23 4 24 2 24 .6 24-.5 23.6-1.4 22.8c-.9-.8-1.4-1.9-1.4-3.3 0-1.5.5-2.7 1.6-3.6 1.1-.9 2.5-1.4 4.4-1.4.6 0 1.2 0 1.9.1.7.1 1.3.2 2 .4v-1.3c0-1.3-.3-2.2-.8-2.7-.5-.5-1.4-.8-2.7-.8-.6 0-1.2.1-1.8.2-.6.2-1.2.3-1.8.6-.3.1-.5.2-.6.2-.1 0-.2.1-.3.1-.3 0-.4-.2-.4-.6v-.9c0-.3.1-.6.2-.7.1-.1.3-.3.6-.4.6-.3 1.4-.6 2.2-.8.9-.2 1.8-.3 2.8-.3 2.1 0 3.7.5 4.7 1.4 1 .9 1.5 2.4 1.5 4.3v5.7zM4.4 21c.6 0 1.2-.1 1.8-.3.6-.2 1.2-.6 1.7-1.1.3-.3.5-.7.6-1.1.1-.4.2-1 .2-1.6V16c-.5-.1-1-.2-1.6-.3-.6-.1-1.1-.1-1.6-.1-1.1 0-2 .2-2.5.7-.5.4-.8 1.1-.8 2 0 .8.2 1.5.6 1.9.4.5.9.8 1.6.8z"
        />
      </svg>
    );
  }
  if (provider === "azure") {
    return (
      <svg viewBox="0 0 32 32" className={cn("text-azure", className)} {...dim}>
        <path
          fill="currentColor"
          d="M14.6 4 4 26h6.7l4-9.5L18 22 9.6 28h17.5L14.6 4z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className={cn("text-gcp", className)} {...dim}>
      <path
        fill="currentColor"
        d="M19.4 12.4 22 9.7c.3-.3.3-.7 0-1A8.95 8.95 0 0 0 16 6c-3.6 0-6.7 2.1-8.1 5.2 0 .1.1.1.2.1l3.7-1.3c.6-.2 1.3-.2 1.9.1l1 .5c2.1 1.1 4.5 1.4 4.7 1.8zM27 16c0-.7-.1-1.4-.2-2.1-.1-.4-.6-.7-1-.6l-3 .9c-.5.1-.8.6-.7 1.1.1.5.2 1 .2 1.5 0 2.4-1.4 4.5-3.4 5.5-.4.2-.6.6-.5 1l1.2 3.4c.1.4.6.6 1 .5 3.6-1.5 6.4-5.1 6.4-9.2zM12 22.4c-1.1-.5-2-1.4-2.5-2.5-.4-.9-1.5-1.2-2.3-.6L4 21.6c1.5 2.7 4 4.7 7 5.4.5.1 1-.2 1-.7v-3.5c0-.2 0-.3-.1-.4zM5.7 17.6c-.3-1.5-.1-3 .4-4.4l-3.6-1.3c-.5-.2-1.1.1-1.2.6-.7 2.5-.7 5.1.1 7.6.2.5.7.8 1.2.6L6.3 19c-.4-.4-.5-.8-.6-1.4z"
      />
    </svg>
  );
}
