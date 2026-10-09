"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveAppPricesAction, type ActionState } from "@/app/(app)/orgs/[connectionId]/actions";

export interface AppPriceRow {
  /** Form field name: `package:<namespace>` or `connected:<app name>`. */
  field: string;
  name: string;
  detail: string;
  unit: string;
  value: number | null;
  /** Where to look the price up, e.g. the AppExchange listing search. */
  lookupUrl?: string;
  /** Extra line under the app, e.g. the list price used until the customer enters theirs. */
  hint?: string;
}

export function AppPriceForm({ connectionId, groups }: { connectionId: string; groups: { title: string; rows: AppPriceRow[] }[] }) {
  const [state, save, saving] = useActionState<ActionState, FormData>(saveAppPricesAction.bind(null, connectionId), { status: "idle" });

  return (
    <form action={save} className="flex flex-col gap-6">
      {groups
        .filter((g) => g.rows.length > 0)
        .map((g) => (
          <fieldset key={g.title} className="flex flex-col gap-3">
            <legend className="eyebrow mb-3">{g.title}</legend>
            {g.rows.map((r) => (
              <div key={r.field} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.detail}
                    {r.lookupUrl && (
                      <>
                        {" · "}
                        <a href={r.lookupUrl} target="_blank" rel="noreferrer" className="font-semibold text-cobalt hover:underline">
                          Find price on AppExchange ↗
                        </a>
                      </>
                    )}
                  </div>
                  {r.hint && <div className="text-xs text-cobalt">{r.hint}</div>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="relative w-28">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      name={r.field}
                      type="number"
                      min={0}
                      step="0.01"
                      aria-label={`${r.name} price ${r.unit}`}
                      placeholder="—"
                      defaultValue={r.value ?? ""}
                      className="pl-7"
                    />
                  </div>
                  <span className="w-20 text-xs text-muted-foreground">{r.unit}</span>
                </div>
              </div>
            ))}
          </fieldset>
        ))}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save and recalculate"}
        </Button>
        {state.message && <p className={state.status === "error" ? "text-sm text-danger" : "text-sm text-positive"}>{state.message}</p>}
      </div>
    </form>
  );
}
