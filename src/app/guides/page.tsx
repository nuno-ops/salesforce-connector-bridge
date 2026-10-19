import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/app/legal-page";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Salesforce license cost guides",
  description: "Short, practical answers on cutting Salesforce license costs: inactive and frozen users, license types, and renewals.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndex() {
  return (
    <LegalPage title="Salesforce license cost guides" updated={GUIDES[0].updated} eyebrow="Guides">
      <p>Short answers to the questions that come up when you try to cut a Salesforce bill. Each one shows how to check it yourself.</p>
      <ul className="!list-none !pl-0 flex flex-col gap-5">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link href={`/guides/${g.slug}`} className="text-lg font-semibold underline">
              {g.title}
            </Link>
            <p className="mt-1 text-muted-foreground">{g.description}</p>
          </li>
        ))}
      </ul>
    </LegalPage>
  );
}
