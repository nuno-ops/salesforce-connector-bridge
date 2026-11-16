import { describe, expect, it } from "vitest";
import { GUIDES, getGuide, guideMarkdown, parseInline } from "./guides";

const OTHER_PAGES = new Set(["/login", "/security", "/guides"]);

describe("parseInline", () => {
  it("splits text and links", () => {
    expect(parseInline("See [the guide](/guides/x) now.")).toEqual([
      { text: "See " },
      { text: "the guide", href: "/guides/x" },
      { text: " now." },
    ]);
    expect(parseInline("No links here")).toEqual([{ text: "No links here" }]);
  });

  it("ignores external URLs", () => {
    expect(parseInline("[x](https://example.com)")).toEqual([{ text: "[x](https://example.com)" }]);
  });
});

describe("guide in-body links", () => {
  for (const g of GUIDES) {
    const body = g.sections.flatMap((s) => [...(s.paragraphs ?? []), ...(s.list ?? [])]);
    const links = body.flatMap((t) => parseInline(t)).filter((p) => p.href);

    it(`${g.slug}: links point to real pages, once each, never to itself`, () => {
      const hrefs = links.map((l) => l.href!);
      expect(new Set(hrefs).size).toBe(hrefs.length);
      expect(hrefs).not.toContain(`/guides/${g.slug}`);
      for (const h of hrefs) {
        if (h.startsWith("/guides/")) expect(getGuide(h.slice("/guides/".length)), h).toBeDefined();
        else expect(OTHER_PAGES.has(h), h).toBe(true);
      }
      expect(links.length).toBeLessThanOrEqual(5);
    });

    it(`${g.slug}: no link syntax in headings, answer or FAQ`, () => {
      const plain = [g.answer, g.description, ...g.sections.map((s) => s.heading), ...g.faq.flat()];
      for (const t of plain) expect(t).not.toMatch(/\]\(\//);
    });
  }
});

describe("guideMarkdown", () => {
  it("renders every guide with absolute links and no leftover link syntax", () => {
    for (const g of GUIDES) {
      const md = guideMarkdown(g, "https://x.test");
      expect(md.startsWith(`# ${g.title}`)).toBe(true);
      expect(md).not.toMatch(/\]\(\//);
      for (const s of g.sections) expect(md).toContain(`## ${s.heading}`);
    }
  });
});
