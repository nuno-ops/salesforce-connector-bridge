import { z } from "zod";

/** Claude's review of the connected apps found in an org (OAuth tokens). */
export const toolAnalysisSchema = z.object({
  summary: z.string().describe("Two or three sentences on the org's connected-app landscape."),
  tools: z.array(
    z.object({
      appName: z.string(),
      category: z.string().describe("e.g. Data integration, Email, Document generation, BI"),
      verdict: z.enum(["keep", "review", "consolidate", "remove"]),
      reason: z.string().describe("One sentence grounded in the usage data."),
      alternative: z.string().nullable().describe("A native Salesforce feature or cheaper tool, if one plausibly covers it."),
    }),
  ),
  overlaps: z
    .array(z.object({ apps: z.array(z.string()), note: z.string() }))
    .describe("Groups of apps that appear to do the same job."),
});

export type ToolAnalysis = z.infer<typeof toolAnalysisSchema>;

/** Prices pulled from an uploaded Salesforce order form or contract. */
export const contractPricesSchema = z.object({
  fullMonthly: z.number().nullable().describe("Per-user monthly price of the full Sales/Service Cloud license."),
  platformMonthly: z.number().nullable().describe("Per-user monthly price of the Salesforce Platform license."),
  fullSandboxMonthly: z.number().nullable().describe("Monthly price of one Full Copy sandbox."),
  renewalDate: z.string().nullable().describe("Contract end or renewal date, ISO 8601."),
  notes: z.string().describe("Anything that affects the numbers, e.g. annual-only pricing or discounts."),
});

export type ContractPrices = z.infer<typeof contractPricesSchema>;
