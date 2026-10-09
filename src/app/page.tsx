import "./landing.css";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

const CHECKS = [
  ["01", "Inactive users", "Find paid seats held by people who haven't logged in for 30 days or more."],
  ["02", "Integration users", "Flag integrations that may be eligible for the free Integration license."],
  ["03", "Platform downgrades", "Find users who never touch Opportunities, Leads or Cases and may fit a Platform license."],
  ["04", "Unassigned seats", "Surface licenses nobody holds, plus unused seats across installed managed packages."],
  ["05", "Storage + sandboxes", "Spot storage close to its limit and Full Copy sandboxes you may not need."],
  ["06", "Connected apps", "Use AI to review third-party apps and flag possible functional overlap."],
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
    name: "One-off audit",
    price: "$99",
    suffix: " once",
    desc: "The evidence behind every recommendation, ready for action or renewal.",
    items: ["Every user behind the numbers", "CSV export + printable report", "AI review of connected apps", "Prices read from your contract"],
    cta: "Run full audit",
    tone: "audit",
  },
  {
    name: "Savings Monitor",
    price: "$39",
    suffix: "/month",
    desc: "Keep waste from creeping back as your org changes.",
    items: ["Everything in the audit", "Automatic weekly rescans", "Savings history per org", "Cancel any time"],
    cta: "Start monitoring",
    tone: "monitor",
  },
] as const;

const FAQ = [
  [
    "What access do you need?",
    "Read-only API access through Salesforce's standard sign-in. You approve it in Salesforce and can revoke it at any time.",
  ],
  [
    "Will it change anything in my org?",
    "No. Salesforce Saver never writes to your org. It reads metadata such as users, licenses, permissions and limits, and links you to the relevant records so you decide what to change.",
  ],
  [
    "How are savings calculated?",
    "With Salesforce list prices for your edition by default. Enter what you actually pay, or upload your order form, for figures that match your contract.",
  ],
  [
    "Which editions are supported?",
    "Any org with API access, such as Enterprise and Unlimited. Professional Edition needs the API add-on.",
  ],
] as const;

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
              Connect your org with read-only access. Salesforce Saver checks your users, licenses and permissions and gives
              you a priced, ranked list of savings in minutes.
            </p>
            <div className="hero-actions">
              <Link className="primary-hero" href={start}>
                {user ? "Go to your orgs" : "Start a free scan"} <span>→</span>
              </Link>
              <a className="secondary-hero" href="#how">
                How it works <span>↓</span>
              </a>
            </div>
            <p className="trust-line">
              <span>Read-only access</span>
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
            <p>Connect, scan, decide. Your business records stay out of scope.</p>
          </div>
          <div className="steps">
            <article>
              <span className="step-num">1</span>
              <div>
                <h3>Connect</h3>
                <p>Sign in to Salesforce and approve read-only access. Production, sandbox and My Domain logins supported.</p>
              </div>
            </article>
            <article>
              <span className="step-num">2</span>
              <div>
                <h3>Scan</h3>
                <p>We read users, licenses, permissions and limits. Business records are never read or changed.</p>
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
              <p className="security-lead">Enough access to find waste. Not enough access to touch your business data.</p>
              <ul>
                <li>
                  <span>01</span>
                  <p>
                    <strong>Read-only API access</strong>You approve access directly in Salesforce.
                  </p>
                </li>
                <li>
                  <span>02</span>
                  <p>
                    <strong>No business-record access</strong>No access to accounts, contacts, deals or files.
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
                <Link href={start} className={`plan-cta ${p.tone}`}>
                  {p.cta}
                  <span>→</span>
                </Link>
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
              <p>Four answers your security reviewer, admin and finance lead will probably ask for.</p>
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
            <p className="closing-note">Read-only. Fast to disconnect. Free to scan.</p>
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
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/login">Sign in</Link>
          </div>
          <p>Independent product. Not affiliated with Salesforce, Inc.</p>
        </div>
      </footer>
    </div>
  );
}
