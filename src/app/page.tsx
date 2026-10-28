import "./landing.css";
import Link from "next/link";
import { aboutReady } from "@/lib/about";
import { getCurrentUser } from "@/lib/auth";
import { calendlyUrl } from "@/lib/env";
import { jsonLd } from "@/lib/guides";

const CHECKS = [
  ["01", "Unused seats", "Paid seats held by people who haven't logged in for 30 days, frozen users and licenses nobody holds."],
  ["02", "Cheaper licenses", "Users who only need a Platform license, and integrations that can run on the free Integration license."],
  ["03", "Your renewal", "Seats to drop before your notice date and how much your bill rose last year, from your own invoices."],
  ["04", "Unused apps", "Installed and connected apps nobody used in 90 days, or that do the same job, priced at what you pay."],
  ["05", "The right edition", "Whether you need Unlimited, and Service Cloud licenses on people who never touch a case."],
  ["06", "Sandboxes + duplicates", "Paid sandboxes nobody has refreshed in a year, and people paid for twice across your orgs."],
] as const;

const PLANS = [
  {
    name: "Free scan",
    price: "$0",
    suffix: "",
    desc: "Know the size of the opportunity before you spend a dollar.",
    items: ["Total yearly savings", "Ranked recommendations", "List prices or your own"],
    cta: "Start free scan",
    tone: "free",
  },
  {
    name: "Full report",
    price: "From $290",
    suffix: " once",
    desc: "The evidence behind every saving, ready for finance and your renewal. Priced by org size.",
    items: [
      "Every user and app behind the numbers",
      "Renewal buying options",
      "CSV export + printable report",
      "90 days of access, rescans included",
      "$290 up to 50 users, $590 up to 250, $990 above",
      "Free if we find less than the price",
    ],
    cta: "Start free scan",
    tone: "audit",
  },
  {
    name: "Expert call",
    price: "Talk to us",
    suffix: "",
    desc: "A Salesforce specialist helps you act on the report and get more from Salesforce.",
    items: ["Walk through your savings", "Plan your renewal negotiation", "Help with the clean-up", "Any other Salesforce work"],
    cta: "Book a call",
    tone: "monitor",
    expert: true,
  },
] as const;

const FAQ = [
  [
    "What is Salesforce Saver?",
    "A tool that scans your Salesforce org and shows, in dollars, how much you can save on your Salesforce contract: unused and misassigned licenses, unused apps and sandboxes, and seats to drop before your renewal notice date. It only reads data and changes nothing.",
  ],
  [
    "How much does it cost?",
    "The scan is free and shows your total savings and each recommendation. The full report is a one-off payment: $290 up to 50 Salesforce users, $590 up to 250, $990 above, with 90 days of rescans. It's free if we find less than the price.",
  ],
  [
    "What access do you need?",
    "API access through Salesforce's standard sign-in, which you approve in Salesforce and can revoke at any time. Salesforce has no read-only option for apps, so its screen says the app can access and manage your data. Salesforce Saver only runs read queries, listed on our security page. To have Salesforce enforce that, connect as a user who can't edit records. Your admin may first need to give that user Salesforce's Approve Uninstalled Connected Apps permission.",
  ],
  [
    "Will it change anything in my org?",
    "No. Salesforce Saver never writes to your org. It reads users, licenses, permissions and limits, and counts how many records each person created or edited recently without reading what's in them. Then it links you to the relevant records so you decide what to change.",
  ],
  [
    "How are savings calculated?",
    "From your Salesforce invoices, when you connect as a user with the Manage Billing permission, in your contract's currency. Otherwise with Salesforce list prices for your edition. Enter what you actually pay for exact figures.",
  ],
  [
    "Which editions are supported?",
    "Any org with API access, such as Enterprise and Unlimited. Professional Edition needs the API add-on.",
  ],
] as const;

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://salesforcesaver.com";

/** Structured data so search engines and AI assistants can describe the product accurately. */
const STRUCTURED = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Salesforce Saver",
    url: SITE,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Scans a Salesforce org and shows how much you can save on your Salesforce contract: inactive and frozen users, cheaper license fits, unused apps and sandboxes, and seats to drop before renewal. Read-only.",
    offers: [
      { "@type": "Offer", name: "Free scan", price: "0", priceCurrency: "USD" },
      { "@type": "Offer", name: "Full report, up to 50 users", price: "290", priceCurrency: "USD" },
      { "@type": "Offer", name: "Full report, up to 250 users", price: "590", priceCurrency: "USD" },
      { "@type": "Offer", name: "Full report, above 250 users", price: "990", priceCurrency: "USD" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Salesforce Saver",
    url: SITE,
    email: "support@salesforcesaver.com",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  },
];

function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export default async function Home() {
  const user = await getCurrentUser();
  const start = user ? "/dashboard" : "/login";

  return (
    <div className="lp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(STRUCTURED) }} />
      <header className="site-header">
        <div className="shell nav-shell">
          <a className="brand" href="#top">
            <Mark />
            Salesforce Saver
          </a>
          <nav aria-label="Primary navigation">
            <a href="#how">How it works</a>
            <a href="#checks">What we check</a>
            <a href="#security">Security</a>
            <a href="#pricing">Pricing</a>
            <Link href="/guides">Guides</Link>
          </nav>
          <div className="nav-actions">
            {!user && (
              <Link className="sign-in" href="/login">
                Sign in
              </Link>
            )}
            <Link className="nav-cta" href={start}>
              {user ? "Dashboard" : "Start free scan"} <span>↗</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero shell" id="top">
          <div className="hero-copy">
            <p className="eyebrow">Salesforce license optimization</p>
            <h1>
              Stop paying for Salesforce licenses <em>nobody uses.</em>
            </h1>
            <p className="hero-sub">
              Connect your org in a few clicks. Salesforce Saver reads your users, licenses and permissions, changes nothing, and gives
              you a priced, ranked list of savings in minutes.
            </p>
            <div className="hero-actions">
              <Link className="primary-hero" href={start}>
                {user ? "Go to your orgs" : "Start a free scan"} <span>→</span>
              </Link>
              <a className="secondary-hero" href={calendlyUrl()} target="_blank" rel="noreferrer">
                Or scan it together on a call <span>↗</span>
              </a>
            </div>
            <p className="trust-line">
              <span>Never changes your data</span>
              <span>Encrypted tokens</span>
              <span>Disconnect any time</span>
            </p>
          </div>

          <div className="report-wrap" aria-label="Illustrative savings report with sample data">
            <div className="report-note">Illustrative example with sample data</div>
            <div className="report-card">
              <div className="report-top">
                <div>
                  <span className="mono-label">ORG / ACME-SAMPLE</span>
                  <h2>Potential savings</h2>
                </div>
                <span className="scan-state">SCAN COMPLETE</span>
              </div>
              <div className="savings">
                $48,720<span>/yr</span>
              </div>
              <div className="report-rule" />
              <div className="finding">
                <span className="risk-dot lime" />
                <div>
                  <strong>14 inactive users</strong>
                  <small>Salesforce seats · 30+ days inactive</small>
                </div>
                <b>$23,520</b>
              </div>
              <div className="finding">
                <span className="risk-dot coral" />
                <div>
                  <strong>8 downgrade candidates</strong>
                  <small>Possible Platform fit</small>
                </div>
                <b>$17,280</b>
              </div>
              <div className="finding">
                <span className="risk-dot blue" />
                <div>
                  <strong>12 unused package seats</strong>
                  <small>Across 3 installed packages</small>
                </div>
                <b>$7,920</b>
              </div>
              <div className="report-footer">
                <span>Recommendations ranked by value</span>
                <span>View all →</span>
              </div>
            </div>
          </div>
        </section>

        <section className="audience shell">
          <div className="section-kicker">
            <span>Who it helps</span>
            <span>01 / 06</span>
          </div>
          <div className="audience-grid">
            <article>
              <span className="role-index">A</span>
              <h3>Salesforce admins</h3>
              <p>Clean up users and licenses with a ranked list and a direct link to every record.</p>
            </article>
            <article>
              <span className="role-index">R</span>
              <h3>RevOps + IT</h3>
              <p>Keep license usage in line as people join, move and leave.</p>
            </article>
            <article>
              <span className="role-index">F</span>
              <h3>Finance + procurement</h3>
              <p>Go into your renewal with a priced, defensible list of what to cut.</p>
            </article>
          </div>
        </section>

        <section className="checks-section" id="checks">
          <div className="shell">
            <div className="section-kicker light">
              <span>What we check</span>
              <span>02 / 06</span>
            </div>
            <div className="checks-head">
              <h2>Every place Salesforce spend can quietly drift.</h2>
              <p>
                We look at the configuration and usage signals that matter for licensing, then rank the findings by potential
                value.
              </p>
            </div>
            <div className="checks-grid">
              {CHECKS.map(([n, title, body]) => (
                <article className="check-item" key={n}>
                  <span className="check-n">{n}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                  <span className="check-arrow" aria-hidden="true">
                    ↘
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="how shell" id="how">
          <div className="section-kicker">
            <span>How it works</span>
            <span>03 / 06</span>
          </div>
          <div className="how-intro">
            <h2>Three steps. No invasive implementation.</h2>
            <p>Connect, scan, decide. We count activity, never read what&apos;s in your records.</p>
          </div>
          <div className="steps">
            <article>
              <span className="step-num">1</span>
              <div>
                <h3>Connect</h3>
                <p>Sign in to Salesforce and approve access. Production, sandbox and My Domain logins supported.</p>
              </div>
            </article>
            <article>
              <span className="step-num">2</span>
              <div>
                <h3>Scan</h3>
                <p>We read users, licenses, permissions and limits, and count who created or edited records. Nothing is changed.</p>
              </div>
            </article>
            <article>
              <span className="step-num">3</span>
              <div>
                <h3>Save</h3>
                <p>Act on a ranked list with links to each user, or take a printable report to your renewal.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="security" id="security">
          <div className="shell security-grid">
            <div>
              <p className="eyebrow security-eye">Security · 04 / 06</p>
              <h2>
                Your org
                <br />
                <em>stays yours.</em>
              </h2>
            </div>
            <div className="security-copy">
              <p className="security-lead">
                We look for waste and change nothing. <Link href="/security">See every query a scan runs.</Link>
              </p>
              <ul>
                <li>
                  <span>01</span>
                  <p>
                    <strong>Read queries only</strong>You approve access in Salesforce. We never create, edit or delete anything.
                  </p>
                </li>
                <li>
                  <span>02</span>
                  <p>
                    <strong>Counts, not contents</strong>We count records per user. We never read what&apos;s in your accounts, deals, cases or files.
                  </p>
                </li>
                <li>
                  <span>03</span>
                  <p>
                    <strong>AES-256 at rest</strong>Access tokens are encrypted at rest.
                  </p>
                </li>
                <li>
                  <span>04</span>
                  <p>
                    <strong>Clean exit</strong>Disconnecting revokes access and deletes your scans.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="pricing shell" id="pricing">
          <div className="section-kicker">
            <span>Pricing</span>
            <span>05 / 06</span>
          </div>
          <div className="pricing-head">
            <h2>
              Find the waste for free.
              <br />
              Pay only if you want the detail.
            </h2>
            <p>No invented ROI promises. You see the numbers first.</p>
          </div>
          <div className="plans">
            {PLANS.map((p) => (
              <article className={`plan ${p.tone}`} key={p.name}>
                <div className="plan-top">
                  <span className="mono-label">{p.name}</span>
                  <div className="price">
                    {p.price}
                    <small>{p.suffix}</small>
                  </div>
                  <p>{p.desc}</p>
                </div>
                <ul>
                  {p.items.map((x) => (
                    <li key={x}>
                      <span>✓</span>
                      {x}
                    </li>
                  ))}
                </ul>
                {"expert" in p ? (
                  <a href={calendlyUrl()} target="_blank" rel="noreferrer" className={`plan-cta ${p.tone}`}>
                    {p.cta}
                    <span>→</span>
                  </a>
                ) : (
                  <Link href={start} className={`plan-cta ${p.tone}`}>
                    {p.cta}
                    <span>→</span>
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="faq shell">
          <div className="section-kicker">
            <span>FAQ</span>
            <span>06 / 06</span>
          </div>
          <div className="faq-grid">
            <div>
              <h2>Before you connect.</h2>
              <p>
                The answers your security reviewer, admin and finance lead will probably ask for. More in our{" "}
                <Link href="/guides">guides</Link>.
              </p>
            </div>
            <div className="faq-list">
              {FAQ.map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="closing">
          <div className="shell closing-inner">
            <p className="eyebrow">Your next renewal starts here.</p>
            <h2>
              See what you
              <br />
              <em>could save.</em>
            </h2>
            <Link href={start} className="closing-cta">
              Start a free scan <span>↗</span>
            </Link>
            <p className="closing-note">Changes nothing. Fast to disconnect. Free to scan.</p>
          </div>
        </section>
      </main>

      <footer>
        <div className="shell footer-inner">
          <a className="brand footer-brand" href="#top">
            <Mark />
            Salesforce Saver
          </a>
          <div className="footer-links">
            <Link href="/guides">Guides</Link>
            {aboutReady() && <Link href="/about">About</Link>}
            <Link href="/security">Security</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/login">Sign in</Link>
            <a href="mailto:support@salesforcesaver.com">support@salesforcesaver.com</a>
            <a href={calendlyUrl()} target="_blank" rel="noreferrer">
              Book a call
            </a>
          </div>
          <p>Independent product. Not affiliated with Salesforce, Inc.</p>
        </div>
      </footer>
    </div>
  );
}
