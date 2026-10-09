import type { Metadata } from "next";
import { LegalPage } from "@/components/app/legal-page";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="October 7, 2026">
      <p>By using Salesforce Saver you agree to these terms.</p>
      <h2>The service</h2>
      <p>
        Salesforce Saver analyses metadata from Salesforce orgs you connect and estimates potential license savings. Estimates are based
        on list prices or prices you provide and are not a guarantee of savings. Check each recommendation before acting on it.
      </p>
      <h2>Your responsibilities</h2>
      <p>Only connect orgs you are authorised to administer, and keep your sign-in secure.</p>
      <h2>Payments</h2>
      <p>
        Savings Monitor renews monthly until cancelled from the billing portal. A one-off audit unlocks the full report for the period
        shown at checkout. Consultations are booked separately and don&apos;t include report access.
      </p>
      <h2>Not affiliated with Salesforce</h2>
      <p>Salesforce is a trademark of Salesforce, Inc. Salesforce Saver is an independent product.</p>
      <h2>Liability</h2>
      <p>The service is provided as is. To the extent the law allows, our liability is limited to the amount you paid us in the last 12 months.</p>
      <h2>Contact</h2>
      <p>support@salesforcesaver.com</p>
    </LegalPage>
  );
}
