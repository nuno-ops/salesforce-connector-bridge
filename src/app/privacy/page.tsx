import type { Metadata } from "next";
import { LegalPage } from "@/components/app/legal-page";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="October 7, 2026">
      <p>Salesforce Saver helps you find unused and misassigned Salesforce licenses. This page explains what we collect and why.</p>
      <h2>What we read from Salesforce</h2>
      <p>With the read-only access you grant, we read:</p>
      <ul>
        <li>User records: name, username, email, profile, license type, last login and creation dates.</li>
        <li>License counts, permission set and package licenses, profile and permission set access to Opportunities, Leads and Cases.</li>
        <li>Connected app names and usage counts, org limits (storage) and sandbox names.</li>
        <li>Monthly counts of leads and opportunities, and the total amount of closed-won opportunities.</li>
      </ul>
      <p>We do not read or store the contents of your accounts, contacts, leads, opportunities, cases or files, and we never write to your org.</p>
      <h2>What we store</h2>
      <ul>
        <li>Your email address, for sign-in.</li>
        <li>Salesforce access and refresh tokens, encrypted with AES-256-GCM.</li>
        <li>A snapshot of the data above for each scan, so you can see results and history.</li>
        <li>Billing status from Stripe. We never see or store card numbers.</li>
      </ul>
      <h2>Service providers</h2>
      <ul>
        <li>Supabase hosts our database and handles sign-in.</li>
        <li>Stripe processes payments.</li>
        <li>
          Anthropic (Claude) receives connected-app names and usage counts when you request an AI review, and any contract PDF you
          upload to fill in your prices. Uploaded PDFs are not stored by us.
        </li>
      </ul>
      <h2>Deleting your data</h2>
      <p>
        Disconnecting an org revokes our tokens in Salesforce and deletes its scans immediately. To delete your account entirely, email
        support@salesforcesaver.com.
      </p>
    </LegalPage>
  );
}
