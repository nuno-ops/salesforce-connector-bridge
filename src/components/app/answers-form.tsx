"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { saveAnswersAction, skipAnswersAction, type AnswersState } from "@/app/(app)/welcome/actions";
import type { CompanyAnswers } from "@/lib/savings/answers";

type Choice = { value: string; label: string };

function Question({
  name,
  title,
  hint,
  choices,
  value,
  onChange,
  children,
}: {
  name: string;
  title: string;
  hint: string;
  choices: Choice[];
  value: string | undefined;
  onChange: (v: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3 border-b border-border pb-6 last:border-0">
      <legend className="mb-1 text-base font-semibold">{title}</legend>
      <p className="text-sm text-muted-foreground">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => (
          <label
            key={c.value}
            className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
          >
            <input type="radio" name={name} value={c.value} checked={value === c.value} onChange={() => onChange(c.value)} className="sr-only" />
            {c.label}
          </label>
        ))}
      </div>
      {children}
    </fieldset>
  );
}

function Amount({ name, label, hint, value }: { name: string; label: string; hint: string; value?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" min={0} step="1" placeholder="Optional" defaultValue={value ?? ""} className="max-w-56" />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

const YES_NO_UNSURE: Choice[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
];

export function AnswersForm({ answers, next }: { answers: CompanyAnswers | null; next: string }) {
  const [state, save, saving] = useActionState<AnswersState, FormData>(saveAnswersAction.bind(null, next), { status: "idle" });
  const [nonprofit, setNonprofit] = useState(answers?.nonprofit);
  const [premier, setPremier] = useState<string | undefined>(answers?.premier);
  const [aws, setAws] = useState<string | undefined>(answers?.aws);

  return (
    <div className="flex flex-col gap-6">
      <form action={save} className="flex flex-col gap-6">
        <Question
          name="nonprofit"
          title="Are you a registered nonprofit, school or university?"
          hint="Salesforce's Power of Us program donates 10 Enterprise licenses to eligible organizations."
          choices={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={nonprofit}
          onChange={(v) => setNonprofit(v as "yes" | "no")}
        />
        <Question
          name="premier"
          title="Do you pay for Premier or Signature Success?"
          hint="Salesforce's paid support plans. Premier costs 30% of your license fees and shows as its own line on your order form. Unlimited Edition already includes it."
          choices={YES_NO_UNSURE}
          value={premier}
          onChange={setPremier}
        >
          {premier === "yes" && (
            <Amount
              name="premierYearly"
              label="What it costs a year"
              hint="From your order form, in the currency you pay Salesforce in. Leave blank and we'll estimate it from your invoices."
              value={answers?.premierYearly}
            />
          )}
        </Question>
        <Question
          name="aws"
          title="Does your company have an AWS spend commitment?"
          hint="An AWS EDP or PPA. Buying Salesforce through AWS Marketplace can count toward it, so commitment you'd otherwise lose pays for Salesforce."
          choices={YES_NO_UNSURE}
          value={aws}
          onChange={setAws}
        >
          {aws === "yes" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Amount name="awsCommitmentYearly" label="Commitment a year" hint="Your finance or AWS account team knows it." value={answers?.awsCommitmentYearly} />
              <Amount
                name="awsUnusedYearly"
                label="Expected to go unused this year"
                hint="Enter 0 if you'll use it all."
                value={answers?.awsUnusedYearly}
              />
            </div>
          )}
        </Question>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save and continue"}
          </Button>
          {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
        </div>
      </form>
      {!answers && (
        <form action={skipAnswersAction.bind(null, next)}>
          <Button type="submit" variant="link" className="px-0">
            Skip for now
          </Button>
        </form>
      )}
    </div>
  );
}
