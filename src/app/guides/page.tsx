import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/app/legal-page";
import { GUIDES, GUIDE_TOPICS, getGuide, type Guide } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Salesforce license cost guides",
  description:
    "Short, practical answers on cutting Salesforce costs: inactive and frozen users, license types, apps, sandboxes, renewals and ways to pay.",
  alternates: { canonical: "/guides" },
};

function sections(): { title: string; guides: Guide[] }[] {
  const listed = new Set(GUIDE_TOPICS.flatMap((t) => t.slugs));
  const groups = GUIDE_TOPICS.map((t) => ({
    title: t.title,
    guides: t.slugs.map(getGuide).filter((g): g is Guide => Boolean(g)),
  }));
  const rest = GUIDES.filter((g) => !listed.has(g.slug));
  return rest.length ? [...groups, { title: "More guides", guides: rest }] : groups;
}

export default function GuidesIndex() {
  const groups = sections();
  const latest = GUIDES.map((g) => g.updated).sort((a, b) => Date.parse(b) - Date.parse(a))[0];
  return (
    <LegalPage title="Salesforce license cost guides" updated={latest} eyebrow="Guides">
      <p>Short answers to the questions that come up when you try to cut a Salesforce bill. Each one shows how to check it yourself.</p>
      <nav aria-label="Guide topics" className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <a
            key={group.title}
            href={`#${slugify(group.title)}`}
            className="rounded-full border border-foreground/15 px-3 py-1 text-sm hover:border-foreground/40"
          >
            {group.title}
          </a>
        ))}
      </nav>
      {groups.map((group) => (
        <section key={group.title} id={slugify(group.title)} className="flex scroll-mt-6 flex-col gap-5">
          <h2>{group.title}</h2>
          <ul className="!list-none !pl-0 flex flex-col gap-5">
            {group.guides.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="text-lg font-semibold underline">
                  {g.title}
                </Link>
                <p className="mt-1 text-muted-foreground">{g.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </LegalPage>
  );
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
