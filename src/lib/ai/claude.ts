import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { env } from "@/lib/env";
import { contractPricesSchema, type ContractPrices } from "./schemas";

export const CLAUDE_MODEL = "claude-opus-5-5";

function client() {
  if (!env().ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic();
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
