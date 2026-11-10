"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { saveAnswersAction, skipAnswersAction, type AnswersState } from "@/app/(app)/welcome/actions";
import type { CompanyAnswers } from "@/lib/savings/answers";

type Choice = { value: string; label: string };

const CHIP =
  "cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring";

const CLOUD_NAME = { aws: "AWS", google: "Google Cloud", azure: "Azure" } as const;

const CLOUD_CHOICES: Choice[] = [
  { value: "aws", label: "AWS" },
  { value: "google", label: "Google Cloud" },
  { value: "azure", label: "Microsoft Azure" },
  { value: "none", label: "None" },
  { value: "unsure", label: "Not sure" },
];

function initialClouds(answers: CompanyAnswers | null): Set<string> {
  const picked = new Set<string>();
  if (!answers) return picked;
  for (const c of ["aws", "google", "azure"] as const) if (answers[c] === "yes") picked.add(c);
  if (picked.size === 0 && answers.aws === "no") picked.add("none");
  if (picked.size === 0 && answers.aws === "unsure") picked.add("unsure");
  return picked;
}

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
            className={CHIP}
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
  const [clouds, setClouds] = useState<Set<string>>(() => initialClouds(answers));
  const [agentforce, setAgentforce] = useState<string | undefined>(answers?.agentforce);
  const toggleCloud = (v: string) =>
    setClouds((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else {
        // "None" and "Not sure" stand alone; picking a cloud clears them.
        if (v === "none" || v === "unsure") next.clear();
        else {
          next.delete("none");
          next.delete("unsure");
        }
        next.add(v);
      }
      return next;
    });

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
        <fieldset className="flex flex-col gap-3 border-b border-border pb-6">
          <legend className="mb-1 text-base font-semibold">Does your company have a cloud spend commitment?</legend>
          <p className="text-sm text-muted-foreground">
            An AWS EDP or PPA, a Google Cloud commitment or a Microsoft Azure MACC. Buying Salesforce, or apps like Conga and Docusign,
            through that cloud&apos;s marketplace can count toward it, so commitment you&apos;d otherwise lose pays for them. Tick all that
            apply.
          </p>
          <div className="flex flex-wrap gap-2">
            {CLOUD_CHOICES.map((c) => (
              <label key={c.value} className={CHIP}>
                <input type="checkbox" name="cloud" value={c.value} checked={clouds.has(c.value)} onChange={() => toggleCloud(c.value)} className="sr-only" />
                {c.label}
              </label>
            ))}
          </div>
          {(["aws", "google", "azure"] as const)
            .filter((c) => clouds.has(c))
            .map((c) => (
              <div key={c} className="grid gap-4 sm:grid-cols-2">
                <Amount
                  name={`${c}CommitmentYearly`}
                  label={`${CLOUD_NAME[c]} commitment a year`}
                  hint="Your finance team or account manager knows it."
                  value={answers?.[`${c}CommitmentYearly`]}
                />
                <Amount
                  name={`${c}UnusedYearly`}
                  label="Expected to go unused this year"
                  hint="Enter 0 if you'll use it all."
                  value={answers?.[`${c}UnusedYearly`]}
                />
              </div>
            ))}
        </fieldset>
        <Question
          name="agentforce"
          title="Are you planning to buy Agentforce or AI credits this year?"
          hint="Salesforce can convert user licenses you don't need into Flex Credits for Agentforce, so unused seats pay for AI instead of new spend."
          choices={YES_NO_UNSURE}
          value={agentforce}
          onChange={setAgentforce}
        />
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
