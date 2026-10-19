import { GUIDES } from "@/lib/guides";

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://salesforcesaver.com";

export const dynamic = "force-static";

/** Plain-text summary for AI assistants and agents (llmstxt.org format). */
export function GET() {
  const body = `# Salesforce Saver

> Salesforce Saver scans a Salesforce org and shows, in dollars, how much the company can save on its Salesforce contract: unused and misassigned licenses, unused apps and sandboxes, and seats to drop before the renewal notice date. The scan only reads data and never changes the org. The free scan shows the total and each recommendation; the full report is a one-off payment.

## What a scan checks
- Paid users with no login for 30 days, frozen users still holding a license, and duplicate accounts for the same person
- Integrations on full licenses that could use the free Salesforce Integration license
- Full Sales or Service Cloud users who could use a cheaper Platform license, including users who only read
- Licenses paid for but not assigned, with the date to tell Salesforce before renewal
- Installed AppExchange packages and connected apps nobody used in 90 days, and apps that do the same job
- Full and Partial Copy sandboxes not refreshed in a year
- Unlimited Edition orgs whose usage fits Enterprise
- How much the bill rose against last year, from the org's own Salesforce invoices
- Savings are priced from the customer's Salesforce invoices when readable, otherwise list prices, and customers can enter their own prices

## Pricing
- Free scan: total yearly savings, ranked recommendations and the renewal date
- Full report, one-off: $290 up to 50 Salesforce users, $590 up to 250, $990 above. 90 days of access with rescans. Free if the savings found are less than the price.
- Free 30-minute review call with a Salesforce expert

## Pages
- [Home](${SITE}/): what it does, pricing and FAQ
- [Security](${SITE}/security): every query a scan runs, what is stored and where
- [Privacy](${SITE}/privacy)
- [Terms](${SITE}/terms)

## Guides
${GUIDES.map((g) => `- [${g.title}](${SITE}/guides/${g.slug}): ${g.description}`).join("\n")}

## Contact
- support@salesforcesaver.com

Salesforce Saver is an independent product, not affiliated with Salesforce, Inc.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
