"use client";

import { FileText, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  extractContractAction,
  savePricesAction,
  type ActionState,
  type ContractState,
} from "@/app/(app)/orgs/[connectionId]/actions";
import type { PriceBook } from "@/lib/savings/prices";

type Values = { fullMonthly: string; platformMonthly: string; integrationMonthly: string; fullSandboxMonthly: string };

const toValues = (p: PriceBook): Values => ({
  fullMonthly: String(p.fullMonthly),
  platformMonthly: String(p.platformMonthly),
  integrationMonthly: String(p.integrationMonthly),
  fullSandboxMonthly: p.fullSandboxMonthly === null ? "" : String(p.fullSandboxMonthly),
});

export function PriceForm({ connectionId, prices, aiEnabled }: { connectionId: string; prices: PriceBook; aiEnabled: boolean }) {
  const [values, setValues] = useState<Values>(toValues(prices));
  const [source, setSource] = useState<"manual" | "contract">(prices.source === "contract" ? "contract" : "manual");
  const [saveState, save, saving] = useActionState<ActionState, FormData>(savePricesAction.bind(null, connectionId), { status: "idle" });
  const [contractState, extract, extracting] = useActionState<ContractState, FormData>(
    async (prev, formData) => {
      const res = await extractContractAction(connectionId, prev, formData);
      if (res.prices) {
        const p = res.prices;
        setValues((v) => ({
          ...v,
          fullMonthly: p.fullMonthly !== null ? String(p.fullMonthly) : v.fullMonthly,
          platformMonthly: p.platformMonthly !== null ? String(p.platformMonthly) : v.platformMonthly,
          fullSandboxMonthly: p.fullSandboxMonthly !== null ? String(p.fullSandboxMonthly) : v.fullSandboxMonthly,
        }));
        setSource("contract");
      }
      return res;
    },
    { status: "idle" },
  );

  const field = (name: keyof Values, label: string, hint: string, optional = false) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">$</span>
        <Input
          id={name}
          name={name}
          type="number"
          min={0}
          step="0.01"
          required={!optional}
          className="pl-7"
          value={values[name]}
          onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
        />
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {aiEnabled && (
        <form action={extract} className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4">
          <Label htmlFor="contract" className="flex items-center gap-2">
            <FileText className="size-4" /> Fill from your Salesforce order form (PDF)
          </Label>
          <input id="contract" name="contract" type="file" accept="application/pdf" className="text-sm" />
          <Button type="submit" variant="outline" size="sm" className="self-start" disabled={extracting}>
            {extracting && <Loader2 className="animate-spin" />}
            {extracting ? "Reading…" : "Read prices"}
          </Button>
          {contractState.status === "error" && <p className="text-sm text-danger">{contractState.message}</p>}
          {contractState.prices && (
            <p className="text-sm text-muted-foreground">
              Filled in what we found. Check the numbers before saving. {contractState.prices.notes}
            </p>
          )}
          <p className="text-xs text-muted-foreground">The file is sent to Claude to read the prices and isn&apos;t stored.</p>
        </form>
      )}

      <form action={save} className="flex flex-col gap-5">
        <input type="hidden" name="source" value={source} />
        <div className="grid gap-5 sm:grid-cols-2">
          {field("fullMonthly", "Full Salesforce license", "Per user per month, e.g. Sales Cloud Enterprise.")}
          {field("platformMonthly", "Salesforce Platform license", "Per user per month.")}
          {field("integrationMonthly", "Salesforce Integration license", "Usually $0: most editions include 5.")}
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
