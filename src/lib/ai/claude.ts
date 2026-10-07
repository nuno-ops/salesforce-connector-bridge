import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { env } from "@/lib/env";
import type { OrgSnapshot } from "@/lib/salesforce/types";
import { contractPricesSchema, toolAnalysisSchema, type ContractPrices, type ToolAnalysis } from "./schemas";

export const CLAUDE_MODEL = "claude-opus-5-5";

function client() {
  if (!env().ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic();
}

/** Usage per connected app, aggregated from OAuth tokens. Only names and counts leave the server. */
export function summariseApps(snapshot: OrgSnapshot) {
  const apps = new Map<string, { users: Set<string>; totalUses: number; lastUsed: string | null }>();
  for (const t of snapshot.oauthTokens) {
    const a = apps.get(t.appName) ?? { users: new Set(), totalUses: 0, lastUsed: null };
    a.users.add(t.userId);
    a.totalUses += t.useCount;
    if (t.lastUsedDate && (!a.lastUsed || t.lastUsedDate > a.lastUsed)) a.lastUsed = t.lastUsedDate;
    apps.set(t.appName, a);
  }
  return [...apps.entries()]
    .map(([appName, a]) => ({ appName, users: a.users.size, totalUses: a.totalUses, lastUsed: a.lastUsed?.slice(0, 10) ?? null }))
    .sort((x, y) => y.totalUses - x.totalUses);
}

export async function analyseTools(snapshot: OrgSnapshot): Promise<ToolAnalysis> {
  const apps = summariseApps(snapshot);
  if (apps.length === 0) return { summary: "No connected apps with recorded usage were found.", tools: [], overlaps: [] };

  const response = await client().messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: zodOutputFormat(toolAnalysisSchema) },
    system:
      "You are a Salesforce licensing consultant reviewing the third-party apps connected to a customer's org. " +
      "Judge each app from its usage numbers and what the product is generally known for. Flag apps that look unused, " +
      "that duplicate each other, or that a standard Salesforce feature covers. Say so plainly when you don't recognise an app " +
      "rather than guessing what it does.",
    messages: [
      {
        role: "user",
        content:
          `Org edition: ${snapshot.organization.edition}. Active users: ${snapshot.users.length}. Snapshot date: ${snapshot.capturedAt.slice(0, 10)}.\n\n` +
          `Connected apps (users = distinct users with a token, totalUses = OAuth token use count, lastUsed = most recent use):\n` +
          JSON.stringify(apps, null, 2),
      },
    ],
  });

  if (response.stop_reason === "refusal") throw new Error("Claude declined to analyse these apps.");
  if (!response.parsed_output) throw new Error("Claude's analysis couldn't be parsed.");
  return response.parsed_output;
}

/** Reads per-user and sandbox prices from a Salesforce order form or contract PDF. */
export async function extractContractPrices(pdf: Buffer): Promise<ContractPrices> {
  const response = await client().messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: { effort: "low", format: zodOutputFormat(contractPricesSchema) },
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf.toString("base64") } },
          {
            type: "text",
            text:
              "This is a Salesforce order form or contract. Extract the net per-user monthly price for the full Sales or Service Cloud " +
              "user license and for the Salesforce Platform license, and the monthly price of a Full Copy sandbox. Convert annual " +
              "prices to monthly. Use null for anything the document doesn't state.",
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") throw new Error("Claude declined to read this document.");
  if (!response.parsed_output) throw new Error("Couldn't read prices from this document.");
  return response.parsed_output;
}
