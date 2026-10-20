import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/app/legal-page";
import { ABOUT, aboutReady, authorJsonLd } from "@/lib/about";
import { calendlyUrl } from "@/lib/env";
import { jsonLd } from "@/lib/guides";

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://salesforcesaver.com";

export const metadata: Metadata = {
  title: "About Salesforce Saver",
  description:
    "Salesforce Saver is built by Nuno, a Salesforce consultant in Portugal with 10 years of Salesforce experience in retail, finance and SaaS, from admin to solution architect.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const about = ABOUT;
  if (!aboutReady(about)) notFound();

  const structured = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: `${SITE}/about`,
    mainEntity: authorJsonLd(SITE, about),
    publisher: {
      "@type": "Organization",
      name: about.company?.legalName ?? "Salesforce Saver",
      url: SITE,
      email: "support@salesforcesaver.com",
      ...(!about.company && about.country ? { address: { "@type": "PostalAddress", addressCountry: about.country } } : {}),
      ...(about.company ? { address: { "@type": "PostalAddress", addressCountry: about.company.country, ...(about.company.city ? { addressLocality: about.company.city } : {}) } } : {}),
    },
  };

  return (
    <LegalPage title="About Salesforce Saver" updated="October 20, 2026" eyebrow="About">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {about.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={about.photo} alt={about.name} width={120} height={120} className="size-[120px] rounded-lg object-cover" />
        )}
        <div className="flex flex-col gap-1">
          <h2 className="!mt-0">{about.name}</h2>
          {about.role && <p className="text-muted-foreground">{about.role}</p>}
          {about.linkedin && (
            <a href={about.linkedin} target="_blank" rel="noreferrer" className="underline">
              LinkedIn
            </a>
          )}
        </div>
      </div>

      <p className="text-lg">
        Salesforce Saver scans your Salesforce org read-only and lists what you can stop paying for: unused and
        mismatched licences, apps nobody uses, idle sandboxes, and the dates that matter before your renewal. Savings
        are priced from your own invoices where it can read them.
      </p>
      {about.experience && (
        <>
          <h2>About Nuno</h2>
          <p>{about.experience}</p>
          {about.why && <p>{about.why}</p>}
        </>
      )}
      {about.certifications.length > 0 && (
        <>
          <h2>Salesforce certifications</h2>
          <ul>
            {about.certifications.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </>
      )}

      <h2>How Salesforce Saver treats your org</h2>
      <ul>
        <li>Read queries only. You approve access in Salesforce, and the scan never creates, edits or deletes anything.</li>
        <li>Counts, not contents. It counts records per user and never reads what is in your accounts, deals, cases or files.</li>
        <li>
          Every query is public. The <Link href="/security" className="underline">security page</Link> lists each one the scan runs.
        </li>
        <li>Salesforce access tokens are encrypted with AES-256-GCM before they are stored.</li>
        <li>Disconnecting revokes access in Salesforce and deletes your scans straight away.</li>
        <li>Payments go through Stripe, so card numbers are never seen or stored here.</li>
        <li>The scan is free, and the full report is free if it finds less than its price.</li>
      </ul>

      <h2>The company</h2>
      <p>
        {about.company
          ? `Salesforce Saver is run by ${about.company.legalName}, registered in ${about.company.country}${about.company.city ? ` and based in ${about.company.city}` : ""}.`
          : `Salesforce Saver is built and run by ${about.name}${about.country ? `, based in ${about.country}` : ""}.`}{" "}
        It is an independent product, not affiliated with Salesforce, Inc.
      </p>

      <h2>Get in touch</h2>
      <p>
        Email <a href="mailto:support@salesforcesaver.com" className="underline">support@salesforcesaver.com</a>, or{" "}
        <a href={calendlyUrl()} target="_blank" rel="noreferrer" className="underline">
          book a free 30-minute call
        </a>
        . You can see exactly what the scan reads on the <Link href="/security" className="underline">security page</Link>.
      </p>
    </LegalPage>
  );
}
