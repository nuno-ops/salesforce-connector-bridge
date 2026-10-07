"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { FlaggedUser } from "@/lib/savings/engine";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const confidenceVariant = { high: "default", medium: "warning", low: "muted" } as const;

export function UserTabs({
  tabs,
  instanceUrl,
}: {
  tabs: { key: string; label: string; users: FlaggedUser[] }[];
  instanceUrl: string;
}) {
  const [active, setActive] = useState(tabs.find((t) => t.users.length)?.key ?? tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === active}
            onClick={() => setActive(t.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              t.key === active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
            )}
          >
            {t.label} <span className="opacity-70">({t.users.length})</span>
          </button>
        ))}
      </div>
      {current && current.users.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nothing found here. Nice.</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>User</TH>
              <TH>Profile</TH>
              <TH>Last login</TH>
              <TH>Why</TH>
              <TH className="text-right">Yearly savings</TH>
            </tr>
          </THead>
          <TBody>
            {current?.users.map((u) => (
              <TR key={u.id}>
                <TD>
                  <a
                    href={`${instanceUrl}/${u.id}?noredirect=1&isUserEntityOverride=1`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium hover:underline"
                  >
                    {u.name} <ExternalLink className="size-3 text-muted-foreground" />
                  </a>
                  <div className="text-xs text-muted-foreground">{u.username}</div>
                </TD>
                <TD>
                  {u.profileName}
                  <div className="text-xs text-muted-foreground">{u.licenseName}</div>
                </TD>
                <TD className="whitespace-nowrap">{formatDate(u.lastLoginDate)}</TD>
                <TD>
                  {u.reason} <Badge variant={confidenceVariant[u.confidence]}>{u.confidence}</Badge>
                </TD>
                <TD className="text-right font-medium">{formatCurrency(u.annualSavings)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
