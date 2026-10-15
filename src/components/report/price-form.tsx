"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { savePricesAction, type ActionState } from "@/app/(app)/orgs/[connectionId]/actions";
import type { PriceBook } from "@/lib/savings/prices";

type Values = { fullMonthly: string; platformMonthly: string; integrationMonthly: string; fullSandboxMonthly: string };

const toValues = (p: PriceBook): Values => ({
  fullMonthly: String(p.fullMonthly),
  platformMonthly: String(p.platformMonthly),
  integrationMonthly: String(p.integrationMonthly),
  fullSandboxMonthly: p.fullSandboxMonthly === null ? "" : String(p.fullSandboxMonthly),
});

export function PriceForm({
  connectionId,
  prices,
  symbol = "$",
}: {
  connectionId: string;
  prices: PriceBook;
  /** Currency symbol shown in the inputs. */
  symbol?: string;
}) {
  const [values, setValues] = useState<Values>(toValues(prices));
  // Prices filled from an order form earlier keep that label when saved again.
  const source = prices.source === "contract" ? "contract" : "manual";
  const [saveState, save, saving] = useActionState<ActionState, FormData>(savePricesAction.bind(null, connectionId), { status: "idle" });

  const field = (name: keyof Values, label: string, hint: string, optional = false) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">{symbol}</span>
        <Input
          id={name}
          name={name}
          type="number"
          min={0}
          step="0.01"
          required={!optional}
          className={symbol.length > 1 ? "pl-12" : "pl-7"}
          value={values[name]}
          onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
        />
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <form action={save} className="flex flex-col gap-5">
        <input type="hidden" name="source" value={source} />
        <div className="grid gap-5 sm:grid-cols-2">
          {field("fullMonthly", "Full Salesforce license", "Per user per month, e.g. Sales Cloud Enterprise.")}
          {field("platformMonthly", "Salesforce Platform license", "Per user per month.")}
          {field("integrationMonthly", "Salesforce Integration license", `Usually ${symbol}0: most editions include 5.`)}
          {field("fullSandboxMonthly", "Full Copy sandbox", "Per sandbox per month. Leave blank if unknown.", true)}
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save and recalculate"}
          </Button>
          {saveState.message && (
            <p className={saveState.status === "error" ? "text-sm text-danger" : "text-sm text-positive"}>{saveState.message}</p>
          )}
        </div>
      </form>
    </div>
  );
}
