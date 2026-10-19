import type { Metadata } from "next";
import { LegalPage } from "@/components/app/legal-page";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="October 12, 2026">
      <p>Salesforce Saver helps you find unused and misassigned Salesforce licenses. This page explains what we collect and why.</p>
      <h2>What we read from Salesforce</h2>
      <p>With the access you grant, we only read, and we read:</p>
      <ul>
        <li>User records: name, username, email, profile, license type, last login and creation dates.</li>
        <li>License counts, permission set and package licenses, profile and permission set access to Opportunities, Leads and Cases.</li>
        <li>Connected app names and usage counts, installed AppExchange packages, org limits, and sandbox names and refresh dates.</li>
        <li>
          How many records each user created or edited in the last 90 days, and when each installed package&apos;s objects last changed.
          These are counts and dates only.
        </li>
        <li>
          Your own Salesforce subscription, when the connected user has the Manage Billing permission: contract number, dates,
          renewal and billing terms, and invoice dates and totals. We never read payment card details.
        </li>
      </ul>
      <p>
        We do not read or store the contents of your accounts, contacts, leads, opportunities, cases or files, and we never write to your
        org. Every query is listed on our <a href="/security">security page</a>.
      </p>
      <h2>What we store</h2>
      <ul>
        <li>Your email address, for sign-in.</li>
        <li>Salesforce access and refresh tokens, encrypted with AES-256-GCM.</li>
        <li>A snapshot of the data above for each scan, so you can see results and history.</li>
        <li>Billing status from Stripe. We never see or store card numbers.</li>
        <li>
          Simple usage statistics: which pages are viewed, the site you came from, and steps such as signing up or finishing a scan.
          We use no cookies or tracking scripts for this and don&apos;t store your IP address; a visit is counted with a code that
          changes every day.
        </li>
      </ul>
      <h2>Emails we send</h2>
      <p>
        Besides sign-in links, we email you when a scan you started is ready or didn&apos;t finish. We don&apos;t send marketing
        emails.
      </p>
      <h2>Service providers</h2>
      <ul>
        <li>Supabase hosts our database (London, UK) and handles sign-in.</li>
        <li>Netlify runs the app (United States).</li>
        <li>Stripe processes payments.</li>
        <li>Resend sends our emails.</li>
      </ul>
      <h2>Deleting your data</h2>
      <p>
        Disconnecting an org revokes our tokens in Salesforce and deletes its scans immediately. To delete your account entirely, email
        support@salesforcesaver.com.
      </p>
    </LegalPage>
  );
}
