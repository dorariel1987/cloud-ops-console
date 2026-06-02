import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  Phone,
  Siren,
  UserCheck,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/shared/metric-card";
import { CloudBadge } from "@/components/shared/cloud-badge";
import {
  IncidentStatusPill,
  SeverityPill,
} from "@/components/shared/status-pill";
import { getAggregatedIncidents } from "@/lib/providers/registry";
import { parseSearchParams, type PageSearchParams } from "@/lib/page-utils";
import { formatDuration, relativeTime } from "@/lib/utils";
import type { Incident } from "@/lib/types";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function OnCallPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const sp = await searchParams;
  const { providers, activeProviders, rangeDays } = parseSearchParams(sp);
  const data = await getAggregatedIncidents(rangeDays, providers);

  return (
    <>
      <Header
        title="On-Call & Incidents"
        description={`Real-time alerts and rotation across ${activeProviders.length} cloud${activeProviders.length === 1 ? "" : "s"}`}
      />

      <main className="flex-1 space-y-6 p-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Open incidents"
            value={String(data.metrics.open)}
            icon={<Siren className="h-4 w-4" />}
            accent={data.metrics.openSev1 > 0 ? "destructive" : "warning"}
            hint={`${data.metrics.openSev1} SEV1 · ${data.metrics.openSev2} SEV2`}
          />
          <MetricCard
            label="Last 7 days"
            value={String(data.metrics.last7DaysCount)}
            icon={<AlertOctagon className="h-4 w-4" />}
            hint="Incidents triggered"
          />
          <MetricCard
            label="MTTA"
            value={formatDuration(data.metrics.mttaMs)}
            icon={<UserCheck className="h-4 w-4" />}
            accent="info"
            hint="Mean time to acknowledge"
          />
          <MetricCard
            label="MTTR"
            value={formatDuration(data.metrics.mttrMs)}
            icon={<CheckCircle2 className="h-4 w-4" />}
            accent="success"
            hint="Mean time to resolve"
          />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Active incidents</CardTitle>
              <CardDescription>
                Open across all selected clouds — newest first
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.active.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">No active incidents.</p>
                  <p className="text-xs text-muted-foreground">
                    All systems are within their alert thresholds.
                  </p>
                </div>
              ) : (
                <ul className="divide-y">
                  {data.active.map((i) => (
                    <IncidentRow key={i.id} incident={i} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                On-call now
              </CardTitle>
              <CardDescription>
                Active rotations across teams
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.onCall.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active rotations.</p>
              ) : (
                data.onCall.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{shift.team}</span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {shift.schedule}
                      </span>
                    </div>
                    <PersonRow
                      role="Primary"
                      name={shift.primary.name}
                      tz={shift.primary.timezone}
                      color={shift.primary.avatarColor}
                    />
                    {shift.secondary && (
                      <PersonRow
                        role="Secondary"
                        name={shift.secondary.name}
                        tz={shift.secondary.timezone}
                        color={shift.secondary.avatarColor}
                      />
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Until {new Date(shift.endsAt).toLocaleString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        weekday: "short",
                      })}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Incident timeline</CardTitle>
            <CardDescription>Active and recently resolved</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">
                  Active{" "}
                  <span className="ml-1.5 rounded bg-muted px-1.5 text-xs font-normal text-muted-foreground">
                    {data.active.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="resolved">
                  Resolved{" "}
                  <span className="ml-1.5 rounded bg-muted px-1.5 text-xs font-normal text-muted-foreground">
                    {data.recentResolved.length}
                  </span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="active">
                <ul className="divide-y rounded-md border">
                  {data.active.map((i) => (
                    <IncidentRow key={i.id} incident={i} />
                  ))}
                  {data.active.length === 0 && (
                    <li className="px-6 py-6 text-center text-sm text-muted-foreground">
                      Nothing active.
                    </li>
                  )}
                </ul>
              </TabsContent>
              <TabsContent value="resolved">
                <ul className="divide-y rounded-md border">
                  {data.recentResolved.map((i) => (
                    <IncidentRow key={i.id} incident={i} resolved />
                  ))}
                </ul>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function IncidentRow({
  incident,
  resolved,
}: {
  incident: Incident;
  resolved?: boolean;
}) {
  const ackMs = incident.acknowledgedAt
    ? new Date(incident.acknowledgedAt).getTime() -
      new Date(incident.triggeredAt).getTime()
    : null;
  const resolveMs = incident.resolvedAt
    ? new Date(incident.resolvedAt).getTime() -
      new Date(incident.triggeredAt).getTime()
    : null;

  return (
    <li className="flex items-start gap-4 px-6 py-3">
      <SeverityPill severity={incident.severity} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{incident.title}</span>
          <IncidentStatusPill status={incident.status} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <CloudBadge provider={incident.provider} variant="ghost" />
          <span>{incident.service}</span>
          <span>· {incident.source}</span>
          {incident.assignee && <span>· assigned {incident.assignee}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground tabular-nums">
        <span>Triggered {relativeTime(incident.triggeredAt)}</span>
        {ackMs !== null && (
          <span>
            Ack in <span className="font-medium text-foreground">{formatDuration(ackMs)}</span>
          </span>
        )}
        {resolved && resolveMs !== null && (
          <span>
            Resolved in{" "}
            <span className="font-medium text-foreground">{formatDuration(resolveMs)}</span>
          </span>
        )}
      </div>
    </li>
  );
}

function PersonRow({
  role,
  name,
  tz,
  color,
}: {
  role: string;
  name: string;
  tz: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9">
        <AvatarFallback style={{ backgroundColor: color, color: "white" }}>
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">
          {role} · {tz}
        </div>
      </div>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-success opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
    </div>
  );
}
