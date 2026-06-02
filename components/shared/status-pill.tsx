import type { DeploymentStatus, IncidentSeverity, IncidentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEPLOYMENT_STYLES: Record<DeploymentStatus, { label: string; cls: string; dot: string }> = {
  succeeded: { label: "Succeeded", cls: "bg-success/10 text-success", dot: "bg-success" },
  running: { label: "Running", cls: "bg-info/10 text-info", dot: "bg-info animate-pulse" },
  failed: { label: "Failed", cls: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  rolled_back: { label: "Rolled back", cls: "bg-warning/10 text-warning", dot: "bg-warning" },
  queued: { label: "Queued", cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
};

const SEVERITY_STYLES: Record<IncidentSeverity, { label: string; cls: string; dot: string }> = {
  sev1: { label: "SEV1", cls: "bg-destructive/15 text-destructive border-destructive/30", dot: "bg-destructive" },
  sev2: { label: "SEV2", cls: "bg-warning/15 text-warning border-warning/30", dot: "bg-warning" },
  sev3: { label: "SEV3", cls: "bg-info/15 text-info border-info/30", dot: "bg-info" },
  sev4: { label: "SEV4", cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
};

const INCIDENT_STATUS_STYLES: Record<IncidentStatus, { label: string; cls: string }> = {
  triggered: { label: "Triggered", cls: "bg-destructive/10 text-destructive" },
  acknowledged: { label: "Acknowledged", cls: "bg-warning/10 text-warning" },
  investigating: { label: "Investigating", cls: "bg-info/10 text-info" },
  resolved: { label: "Resolved", cls: "bg-success/10 text-success" },
};

export function DeploymentStatusPill({ status, className }: { status: DeploymentStatus; className?: string }) {
  const s = DEPLOYMENT_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        s.cls,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function SeverityPill({ severity, className }: { severity: IncidentSeverity; className?: string }) {
  const s = SEVERITY_STYLES[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wide",
        s.cls,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function IncidentStatusPill({ status, className }: { status: IncidentStatus; className?: string }) {
  const s = INCIDENT_STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        s.cls,
        className,
      )}
    >
      {s.label}
    </span>
  );
}
