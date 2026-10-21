/**
 * Who is behind Salesforce Saver, shown on /about and as the byline on every guide. Only facts the owner has given:
 * leave a field null rather than guess. /about stays hidden (404) until `name` is set.
 */
export type About = {
  name: string | null;
  /** One line, e.g. "Salesforce admin and consultant". */
  role: string | null;
  /** A sentence or two of real Salesforce experience. */
  experience: string | null;
  certifications: string[];
  company: { legalName: string; country: string; city: string | null } | null;
  /** Where the owner works from, shown when there is no company to name. */
  country: string | null;
  linkedin: string | null;
  /** Path under /public, e.g. "/about/nuno.jpg". */
  photo: string | null;
  /** Why the product exists, from what the owner said. */
  why: string | null;
};

export const ABOUT: About = {
  name: "Nuno",
  role: "Salesforce Consultant",
  experience:
    "Nuno is a Salesforce consultant with 10 years of hands-on Salesforce experience in retail, finance and SaaS, in roles from admin to solution architect. He has worked on more than 20 Salesforce orgs, from small companies to orgs with about 1,000 Salesforce users.",
  certifications: [],
  company: null,
  country: "Portugal",
  linkedin: "https://www.linkedin.com/in/nuno-quelhas-311971a8/",
  photo: null,
  why: "He built Salesforce Saver to help customers save money on Salesforce.",
};

export function aboutReady(about: About = ABOUT): about is About & { name: string } {
  return Boolean(about.name);
}

/** "Written by Nuno Quelhas, Salesforce consultant", or null until a name is set. */
export function byline(about: About = ABOUT): string | null {
  if (!aboutReady(about)) return null;
  return about.role ? `${about.name}, ${about.role}` : about.name;
}

/** schema.org Person for an article's author, or null until a name is set. */
export function authorJsonLd(site: string, about: About = ABOUT) {
  if (!aboutReady(about)) return null;
  return {
    "@type": "Person",
    name: about.name,
    ...(about.role ? { jobTitle: about.role } : {}),
    url: `${site}/about`,
    ...(about.linkedin ? { sameAs: [about.linkedin] } : {}),
  };
}
