import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/app/legal-page";
import { GUIDES, getGuide, jsonLd } from "@/lib/guides";

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://salesforcesaver.com";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
  };
}

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();

  const url = `${SITE}/guides/${guide.slug}`;
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      dateModified: new Date(guide.updated).toISOString().slice(0, 10),
      mainEntityOfPage: url,
      publisher: { "@type": "Organization", name: "Salesforce Saver", url: SITE },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  return (
    <LegalPage title={guide.title} updated={guide.updated} eyebrow="Guide">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <p className="text-lg">{guide.answer}</p>

      {guide.sections.map((s) => (
        <section key={s.heading} className="flex flex-col gap-4">
          <h2>{s.heading}</h2>
          {s.paragraphs?.map((p) => <p key={p}>{p}</p>)}
          {s.code && (
            <pre className="overflow-x-auto rounded-md border border-foreground/10 bg-foreground/[0.03] p-4">
              <code>{s.code}</code>
            </pre>
          )}
          {s.list && (
            <ul>
              {s.list.map((li) => (
                <li key={li}>{li}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <h2>Questions</h2>
      {guide.faq.map(([q, a]) => (
        <div key={q}>
          <h3 className="font-semibold">{q}</h3>
          <p>{a}</p>
        </div>
      ))}

      <div className="mt-6 rounded-lg border border-foreground/10 p-6">
        <h2 className="!mt-0">Check your own org</h2>
        <p className="mt-2">
          Salesforce Saver runs these checks in one read-only scan and shows a priced list of savings. The scan is free.{" "}
          <Link href="/login" className="font-semibold text-cobalt underline">
            Start a free scan
          </Link>{" "}
          or <Link href="/security" className="underline">see every query it runs</Link>.
        </p>
      </div>

      <h2>Related guides</h2>
      <ul>
        {guide.related.map((slug) => {
          const g = getGuide(slug);
          return g ? (
            <li key={slug}>
              <Link href={`/guides/${slug}`} className="underline">
                {g.title}
              </Link>
            </li>
          ) : null;
        })}
        <li>
          <Link href="/guides" className="underline">
            All guides
          </Link>
        </li>
      </ul>
    </LegalPage>
  );
}
