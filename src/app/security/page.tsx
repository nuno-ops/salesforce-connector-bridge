import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/app/legal-page";
import { SF_API_VERSION } from "@/lib/salesforce/client";
import {
  ACTIVITY_OBJECTS,
  ACTIVITY_WINDOW_DAYS,
  QUERIES,
  activityQuery,
  deactivatedUsersQuery,
  lastActivityQuery,
  packageObjectsQuery,
} from "@/lib/salesforce/collect";

export const metadata: Metadata = {
  title: "Security",
  description: "Exactly what Salesforce Saver reads from your Salesforce org, what it stores and where.",
  alternates: { canonical: "/security" },
};

/** Read straight from the scan code, so this list can't drift from what actually runs. */
const QUERY_LIST = [
  ...Object.values(QUERIES),
  activityQuery("<object>", "CreatedById"),
  activityQuery("<object>", "LastModifiedById"),
  packageObjectsQuery("<namespace>"),
  lastActivityQuery("<namespace>__<object>__c"),
  deactivatedUsersQuery(["USERIDS"]).replace("'USERIDS'", "<user ids>"),
];

export default function SecurityPage() {
  return (
    <LegalPage title="Security" updated="October 21, 2026" eyebrow="Security">
      <p>
        Salesforce Saver only reads from your org. It never creates, edits or deletes anything in Salesforce. This page lists exactly
        what it reads, what it keeps and how to cut it off.
      </p>

      <h2>What you approve in Salesforce</h2>
      <p>
        You connect through Salesforce&apos;s standard sign-in and approve access on Salesforce&apos;s own screen. Salesforce has no
        read-only option for connected apps, so that screen says the app can &ldquo;access and manage your data&rdquo;. That&apos;s the
        same wording every Salesforce API app gets. What Salesforce Saver does with the access is limited by its code to the read
        queries below.
      </p>
      <p>
        If your security team wants that guaranteed by Salesforce itself, connect as a dedicated user whose profile and permission sets
        have no create, edit or delete rights. The scan then can&apos;t change anything, whatever the approval screen says. A System
        Administrator sees the most; a narrower user works too, and the report lists anything it couldn&apos;t read. To see your
        contract and invoices, the user needs the Manage Billing permission.
      </p>

      <h2>What we read</h2>
      <ul>
        <li>Users: name, username, email, profile, license type, last login and creation dates, and whether they&apos;re frozen.</li>
        <li>License counts, permission set and package licenses, and which profiles and permission sets can see Opportunities, Leads and Cases.</li>
        <li>Connected app names and how often they&apos;re used, installed AppExchange packages, sandbox names and refresh dates, and org limits.</li>
        <li>
          Record counts, not records: how many {ACTIVITY_OBJECTS.join(", ")} records each user created or edited in the last{" "}
          {ACTIVITY_WINDOW_DAYS} days, and when each installed package&apos;s objects last changed. We never read what&apos;s in those
          records.
        </li>
        <li>
          Page view counts from Salesforce&apos;s own Lightning usage data: how many pages each user opened, how many of those were
          sales or case pages, and how many people used each license per month. Never what was on a page.
        </li>
        <li>
          When recently deactivated users were deactivated and last logged in, from the setup audit trail. Only the user Id is taken
          from the audit text, which isn&apos;t stored.
        </li>
        <li>Your Salesforce contract and invoice totals, when the connected user has Manage Billing. Never payment card details.</li>
      </ul>

      <h2>Every query a scan runs</h2>
      <p>
        Through the Salesforce REST API ({SF_API_VERSION}). Placeholders in angle brackets are filled in per object or package. A scan
        also reads <code>/limits</code> and the object list at <code>/sobjects</code>.
      </p>
      <ul>
        {QUERY_LIST.map((q) => (
          <li key={q}>
            <code>{q}</code>
          </li>
        ))}
      </ul>

      <h2>What we store and where</h2>
      <ul>
        <li>Salesforce access and refresh tokens, encrypted with AES-256-GCM before they reach the database.</li>
        <li>A snapshot of the data above for each scan, so results and history load without calling Salesforce again.</li>
        <li>The database is hosted by Supabase in London, UK. The app runs on Netlify servers in the United States.</li>
        <li>Payments go through Stripe. We never see or store card numbers.</li>
        <li>
          To check which of your apps are sold on AWS Marketplace, we search AWS Marketplace&apos;s public catalog by app name. Only the
          app&apos;s name is sent, never your org, users or records.
        </li>
      </ul>

      <h2>Cutting off access</h2>
      <p>
        Disconnecting an org in Salesforce Saver revokes our tokens in Salesforce and deletes its scans straight away. You can also revoke
        access from Salesforce at any time under Setup, Connected Apps OAuth Usage. See the <Link href="/privacy">privacy policy</Link>{" "}
        for the rest.
      </p>
    </LegalPage>
  );
}
