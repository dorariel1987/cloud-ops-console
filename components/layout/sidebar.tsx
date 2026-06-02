"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cloud,
  CreditCard,
  GaugeCircle,
  LayoutDashboard,
  Rocket,
  Siren,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/cost", label: "Cost", icon: CreditCard },
  { href: "/deployments", label: "Deployments", icon: Rocket },
  { href: "/oncall", label: "On-Call & Incidents", icon: Siren },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-card lg:flex">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Cloud className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Cloud Ops</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Console
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-md bg-muted/40 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-success/10 text-success">
            <GaugeCircle className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <div className="font-medium">All systems</div>
            <div className="text-muted-foreground">3 clouds connected</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
