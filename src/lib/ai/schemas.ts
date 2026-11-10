import { z } from "zod";

/** Prices pulled from an uploaded Salesforce order form or contract. */
export const contractPricesSchema = z.object({
  fullMonthly: z.number().nullable().describe("Per-user monthly price of the full Sales/Service Cloud license."),
  platformMonthly: z.number().nullable().describe("Per-user monthly price of the Salesforce Platform license."),
  fullSandboxMonthly: z.number().nullable().describe("Monthly price of one Full Copy sandbox."),
  renewalDate: z.string().nullable().describe("Contract end or renewal date, ISO 8601."),
  notes: z.string().describe("Anything that affects the numbers, e.g. annual-only pricing or discounts."),
});

export type ContractPrices = z.infer<typeof contractPricesSchema>;
