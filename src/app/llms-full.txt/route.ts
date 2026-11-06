import { GUIDES, guideMarkdown } from "@/lib/guides";

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://salesforcesaver.com";

export const dynamic = "force-static";

/** Every guide in full as one Markdown file, for AI assistants and agents (companion to /llms.txt). */
export function GET() {
  const body = `# Salesforce Saver guides, full text

> Every guide on ${SITE}/guides in one file. Salesforce Saver is a read-only scan that shows, in dollars, how much a company can save on its Salesforce contract. Summary and pricing: ${SITE}/llms.txt. Every query a scan runs: ${SITE}/security.

${GUIDES.map((g) => guideMarkdown(g, SITE)).join("\n\n---\n\n")}

---

Salesforce Saver is an independent product, not affiliated with Salesforce, Inc. Contact: support@salesforcesaver.com
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
