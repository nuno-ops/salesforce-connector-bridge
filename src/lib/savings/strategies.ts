import { CLOUD_LABEL, type LookupResults } from "@/lib/apps/marketplaces";
import type { OrgSnapshot } from "@/lib/salesforce/types";
import { nonprofitSaving, premierSaving, type CompanyAnswers } from "./answers";
import { cloudOptions, renewalSeats, resellerQuoteApps } from "./cloud-options";
import type { ContractSummary } from "./contract";
import type { SavingsResult } from "./engine";

/** A buying or contract move worth making at renewal. None is added to the savings total. */
export interface Strategy {
  id: string;
  title: string;
  detail: string;
  /** Yearly saving; `null` when it needs numbers from the customer or can't be estimated. */
  amount: number | null;
  /** What the customer can do to see a figure: give their numbers, or none possible (negotiated). */
  missing?: "answers" | "prices" | "negotiated";
}

const names = (list: string[]) => (list.length <= 2 ? list.join(" and ") : `${list.slice(0, 2).join(", ")} and ${list.length - 2} more`);

/** The contract card's options as short suggestions, biggest figure first, for the top of the report. */
export function contractStrategies(input: {
  contract: ContractSummary;
  result: SavingsResult;
  snapshot: Pick<OrgSnapshot, "organization" | "userLicenses" | "packageLicenses">;
  edition: string;
  answers: CompanyAnswers | null | undefined;
  lookups?: LookupResults;
}): Strategy[] {
  const { contract, result, snapshot, edition, answers, lookups } = input;
  const currency = result.prices.currency ?? "USD";
  const spend = contract.annualSpend && contract.annualSpend.currency === currency ? contract.annualSpend.amount : null;
  const out: Strategy[] = [];

  const rise = contract.priceChange && contract.priceChange.rate >= 0.01 ? contract.priceChange : null;
  if (rise && contract.annualSpend) {
    out.push({
      id: "renewal_rise",
      title: "Cap the renewal price increase",
      detail: `Your invoices are ${Math.round(rise.rate * 100)}% higher than a year ago. Ask your account executive to cap the increase before renewal.`,
      amount: spend !== null ? spend * rise.rate : null,
    });
  }

  const premier = premierSaving(answers, edition, spend);
  if (premier) {
    out.push({
      id: "premier",
      title: "Drop or renegotiate Premier Success",
      detail: "Salesforce's paid support plan costs 30% of license fees. Standard Success is free with every license.",
      amount: premier.amount,
      missing: premier.amount === null ? "answers" : undefined,
    });
  }

  const nonprofit = nonprofitSaving(answers, snapshot, result.prices.fullMonthly, (result.apps ?? []).flatMap((a) => (a.namespace ? [a.namespace] : [])));
  if (nonprofit) {
    out.push({
      id: "nonprofit",
      title: "Apply for Power of Us donated licenses",
      detail: `Salesforce donates up to ${nonprofit.licenses} Enterprise licenses to eligible nonprofits and schools.`,
      amount: nonprofit.annualSavings,
    });
  }

  const clouds = cloudOptions(result, answers, spend, lookups);
  if (clouds.aws) {
    const apps = clouds.aws.apps.map((a) => a.name);
    out.push({
      id: "aws_commit",
      title: "Pay Salesforce through your AWS commitment",
      detail: `Count your Salesforce bill${apps.length ? ` and ${names(apps)}` : ""} toward an AWS spend commitment you'd otherwise leave unused.`,
      amount: clouds.aws.saving,
      missing: clouds.aws.saving === null ? "prices" : undefined,
    });
  }
  for (const cloud of ["google", "azure"] as const) {
    const o = clouds[cloud];
    if (!o || o.apps.length === 0) continue;
    out.push({
      id: `${cloud}_commit`,
      title: `Buy ${names(o.apps.map((a) => a.name))} through ${CLOUD_LABEL[cloud]}`,
      detail: `Count what you pay for ${o.apps.length === 1 ? "it" : "them"} toward your ${CLOUD_LABEL[cloud]} commitment.`,
      amount: o.saving,
      missing: o.saving === null ? "answers" : undefined,
    });
  }

  const reseller = resellerQuoteApps(result, lookups);
  if (reseller.length > 0) {
    out.push({
      id: "aws_reseller",
      title: `Get reseller quotes for ${names(reseller.map((a) => a.name))}`,
      detail: "Sold on AWS Marketplace, where authorized resellers can sometimes quote below the vendor's price.",
      amount: null,
      missing: "negotiated",
    });
  }

  const seats = renewalSeats(result);
  if (answers?.agentforce === "yes" && seats.seats > 0 && seats.annualSavings > 0) {
    out.push({
      id: "flex_credits",
      title: `Turn ${seats.seats} unneeded seats into Flex Credits`,
      detail: "Planning Agentforce? Ask to convert the seats you'd drop into credits instead of buying new ones. Already counted in the total as seats to drop.",
      amount: null,
    });
  }

  return out.sort((a, b) => (b.amount ?? -1) - (a.amount ?? -1));
}
