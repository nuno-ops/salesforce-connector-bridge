import { describe, expect, it } from "vitest";
import { ABOUT, aboutReady, authorJsonLd, byline, type About } from "./about";

const empty: About = { ...ABOUT, name: null, role: null, linkedin: null };
const filled: About = { ...empty, name: "Jane Doe", role: "Salesforce consultant", linkedin: "https://www.linkedin.com/in/jane" };

describe("about", () => {
  it("stays hidden until a name is set", () => {
    expect(aboutReady(empty)).toBe(false);
    expect(byline(empty)).toBeNull();
    expect(authorJsonLd("https://x.test", empty)).toBeNull();
  });

  it("builds the byline and author data from what is given", () => {
    expect(byline(filled)).toBe("Jane Doe, Salesforce consultant");
    expect(byline({ ...filled, role: null })).toBe("Jane Doe");
    expect(authorJsonLd("https://x.test", filled)).toEqual({
      "@type": "Person",
      name: "Jane Doe",
      jobTitle: "Salesforce consultant",
      url: "https://x.test/about",
      sameAs: ["https://www.linkedin.com/in/jane"],
    });
  });
});
