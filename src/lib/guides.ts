/**
 * Public answer pages. Each one answers a single question in its first two sentences, so search engines and AI
 * assistants can quote it. Keep facts to what Salesforce documents or what the scan actually does; no invented figures.
 */

export type GuideSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
  code?: string;
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  /** Direct answer shown first on the page. */
  answer: string;
  updated: string;
  sections: GuideSection[];
  faq: [string, string][];
  /** Other guides to link at the bottom. */
  related: string[];
};

export const GUIDES: Guide[] = [
  {
    slug: "how-to-reduce-salesforce-license-costs",
    title: "How to reduce Salesforce license costs",
    description:
      "The places Salesforce spend usually drifts: inactive and frozen users, the wrong license type, unused apps and sandboxes, and seats you could drop at renewal.",
    answer:
      "Most Salesforce license savings come from four places: paid seats on people who no longer log in, users on a full license who only need a cheaper one, apps and sandboxes nobody uses, and seats you keep paying for because nobody dropped them before the renewal notice date. Salesforce doesn't let you lower seat counts during a contract term, so the work pays off at renewal, and the list needs to be ready before your notice date.",
    updated: "October 17, 2026",
    sections: [
      {
        heading: "1. Remove paid seats nobody uses",
        paragraphs: [
          "Look for active users with no login in the last 30 days, frozen users, and two accounts for the same person (for example \"jdoe\" and \"jdoe.admin\"). Deactivating them frees the license so a new starter can use it instead of you buying another one.",
        ],
      },
      {
        heading: "2. Put people on the right license",
        paragraphs: [
          "A full Sales Cloud or Service Cloud license is only needed by people who work with Leads, Opportunities or Cases. Users who only need Accounts, Contacts, activities and custom objects can often move to a Salesforce Platform license. Integrations that only call the API can run on the Salesforce Integration license, five of which come free with Enterprise, Unlimited and Performance editions.",
        ],
      },
      {
        heading: "3. Cancel apps and sandboxes nobody uses",
        paragraphs: [
          "Installed AppExchange packages and connected apps are often paid per seat or per year and outlive the project they were bought for. Full Copy and Partial Copy sandboxes are paid add-ons too; one nobody has refreshed in a year is a candidate to drop.",
        ],
      },
      {
        heading: "4. Act before the renewal notice date",
        paragraphs: [
          "Salesforce subscriptions can't be reduced mid-term, and they renew automatically unless you give notice before the date in your order form. Take the list of seats and apps to drop to your account executive before that date, along with the price increase you are willing to accept.",
        ],
      },
      {
        heading: "Doing it by hand or with a scan",
        paragraphs: [
          "Each of these can be checked by hand in Setup or with SOQL; the other guides here show how. Salesforce Saver runs the same checks in one read-only scan and prices each one at what you pay, from your Salesforce invoices when it can read them.",
        ],
      },
    ],
    faq: [
      [
        "Can I lower my Salesforce bill in the middle of a contract?",
        "Usually not. Seat quantities can't be decreased during a subscription term, so savings land at renewal. Freeing licenses mid-term still avoids buying new ones for new starters.",
      ],
      [
        "What is the quickest saving to find?",
        "Inactive users. A Last Login report or a single SOQL query lists everyone on a paid license who hasn't logged in for 30 days.",
      ],
    ],
    related: ["find-inactive-salesforce-users", "do-frozen-salesforce-users-use-a-license", "salesforce-renewal-checklist"],
  },
  {
    slug: "find-inactive-salesforce-users",
    title: "How to find inactive Salesforce users",
    description: "Find active Salesforce users on a paid license who haven't logged in recently, with a list view or one SOQL query.",
    answer:
      "In Setup, open Users, create a list view of active users and add the Last Login column, then sort by it. Anyone on a paid license with no login in the last 30 days, or who has never logged in, is holding a seat you may not need.",
    updated: "October 17, 2026",
    sections: [
      {
        heading: "With SOQL",
        paragraphs: ["Run this in the Developer Console or any SOQL tool to list them with their license:"],
        code: "SELECT Id, Name, Username, Profile.UserLicense.Name, LastLoginDate, CreatedDate\nFROM User\nWHERE IsActive = true\n  AND UserType = 'Standard'\n  AND (LastLoginDate < LAST_N_DAYS:30 OR LastLoginDate = null)\nORDER BY LastLoginDate ASC NULLS FIRST",
      },
      {
        heading: "Before you deactivate anyone",
        list: [
          "Skip people created in the last 30 days; they may not have started yet.",
          "Check whether the user runs an integration. Integration logins often don't show as interactive logins; move those to an Integration license instead.",
          "Check what the user owns: records, scheduled reports, flows running as them, and default owner settings. Reassign before deactivating.",
          "If you need to cut access straight away but can't deactivate yet, freeze the user. Freezing doesn't free the license, so deactivate once the clean-up is done.",
        ],
      },
      {
        heading: "Logging in isn't the same as needing the license",
        paragraphs: [
          "Some people log in but only read. A user who hasn't created or edited an Account, Contact, Lead, Opportunity, Case, Task or Event in 90 days may fit a cheaper license. Salesforce Saver checks this alongside last login, and counts records per user without reading what's in them.",
        ],
      },
    ],
    faq: [
      [
        "How many days without a login counts as inactive?",
        "30 days is a common threshold for a paid seat. Use 90 days if your team has seasonal users.",
      ],
      [
        "Does deactivating a user delete their data?",
        "No. Records they own stay in the org and keep their owner. You can reactivate the user later if a license is free.",
      ],
    ],
    related: ["do-frozen-salesforce-users-use-a-license", "salesforce-integration-user-license", "how-to-reduce-salesforce-license-costs"],
  },
  {
    slug: "do-frozen-salesforce-users-use-a-license",
    title: "Do frozen Salesforce users still use a license?",
    description: "Freezing a Salesforce user blocks their login but keeps their license assigned. Deactivating frees it.",
    answer:
      "Yes. Freezing a user only stops them logging in; the license stays assigned to them and you keep paying for it. To free the license, deactivate the user.",
    updated: "October 17, 2026",
    sections: [
      {
        heading: "Freeze vs deactivate",
        list: [
          "Freeze: blocks login straight away. The license stays assigned. Useful while you reassign records or remove the user from hierarchies, workflows and default owner settings that stop deactivation.",
          "Deactivate: blocks login and frees the license for someone else. The user's records stay in the org.",
        ],
      },
      {
        heading: "How to find frozen users",
        paragraphs: ["Frozen status is stored on UserLogin, not User:"],
        code: "SELECT UserId, IsFrozen FROM UserLogin WHERE IsFrozen = true",
      },
      {
        heading: "When it saves money",
        paragraphs: [
          "Deactivating frees the seat now, so you don't buy another for the next starter. Your bill only drops when you reduce the number of seats at renewal, before the notice date in your order form.",
        ],
      },
    ],
    faq: [
      [
        "Why can't I deactivate a user?",
        "Common blockers are being someone's manager in the role hierarchy, being a default lead or case owner, or being named in a workflow, approval process or flow. Freeze the user while you fix those.",
      ],
    ],
    related: ["find-inactive-salesforce-users", "salesforce-renewal-checklist", "how-to-reduce-salesforce-license-costs"],
  },
  {
    slug: "salesforce-integration-user-license",
    title: "Salesforce Integration user license: who can use it",
    description:
      "Enterprise, Unlimited and Performance editions include five free Salesforce Integration licenses for API-only users. Move integrations off full licenses.",
    answer:
      "Enterprise, Unlimited and Performance edition orgs include five Salesforce Integration user licenses at no cost, and Developer Edition orgs include one. They are API-only, so any integration that logs in as a full Sales or Service Cloud user can usually move to one and free that paid seat.",
    updated: "October 17, 2026",
    sections: [
      {
        heading: "What the license allows",
        list: [
          "API access only. The user can't log in to the Salesforce interface.",
          "It uses the Minimum Access - API Only Integrations profile. Grant object access with permission sets and the Salesforce API Integration permission set license.",
          "Extra Integration licenses beyond the free ones are a paid add-on.",
        ],
      },
      {
        heading: "How to spot integrations on full licenses",
        paragraphs: [
          "Look for users named after a tool (\"API\", \"sync\", \"integration\", a vendor name) and for users whose logins are almost all API calls. In Setup, Connected Apps OAuth Usage shows which apps each user authorises.",
        ],
      },
      {
        heading: "Moving one",
        paragraphs: [
          "Create a new user with the Salesforce Integration license, give it the permission sets the tool needs, re-authorise the tool as that user and test it, then deactivate the old full-license user. Check the tool's documentation first: some vendors require a specific license.",
        ],
      },
    ],
    faq: [
      [
        "Can an Integration user log in to Salesforce?",
        "No. It is API-only. Use it for system-to-system tools, not for a person.",
      ],
    ],
    related: ["salesforce-platform-license-vs-full-license", "find-inactive-salesforce-users", "how-to-reduce-salesforce-license-costs"],
  },
  {
    slug: "salesforce-platform-license-vs-full-license",
    title: "Salesforce Platform license vs a full Sales or Service Cloud license",
    description: "Which Salesforce users can move from a full CRM license to a cheaper Salesforce Platform license.",
    answer:
      "A Salesforce Platform license gives access to Accounts, Contacts, activities, custom objects and apps, but not to Leads, Opportunities, Cases or Campaigns. Anyone on a full Sales or Service Cloud license who never needs those objects is a candidate to move to Platform, which costs less per user.",
    updated: "October 17, 2026",
    sections: [
      {
        heading: "Who usually fits",
        list: [
          "Operations, finance or support staff who work in custom apps built on Salesforce.",
          "People who only update Accounts, Contacts and Tasks.",
          "Managers who only read dashboards and reports on custom objects.",
        ],
      },
      {
        heading: "How to check",
        paragraphs: [
          "For each full-license user, check whether their profile and permission sets can read Opportunities, Leads or Cases, and whether they created or edited any of those records recently. A user with no access to them already works like a Platform user. Changing a user's license usually needs a new profile assigned at the same time.",
        ],
      },
    ],
    faq: [
      [
        "Can a Platform user see Opportunities?",
        "No. If someone needs Opportunities, Leads or Cases, they need a full Sales or Service Cloud license.",
      ],
    ],
    related: ["salesforce-integration-user-license", "how-to-reduce-salesforce-license-costs", "find-inactive-salesforce-users"],
  },
  {
    slug: "salesforce-renewal-checklist",
    title: "Salesforce renewal checklist",
    description: "What to check before a Salesforce renewal: the notice date, seats to drop, apps to cancel and the price increase.",
    answer:
      "Find the notice date in your order form first: Salesforce subscriptions renew automatically, and seat reductions have to be agreed before that date. Then list the seats, apps and sandboxes you can drop, compare this year's invoices with last year's, and take both to your account executive.",
    updated: "October 17, 2026",
    sections: [
      {
        heading: "Checklist",
        list: [
          "Contract end date and notice period (in your order form). If you have the Manage Billing permission, Setup shows your contract and invoices under Your Account.",
          "Active users with no login for 30 days, frozen users, and duplicate accounts.",
          "Full licenses held by people who could use Platform, and integrations that could use the free Integration licenses.",
          "Licenses you pay for that aren't assigned to anyone.",
          "AppExchange and connected apps nobody used in 90 days.",
          "Full and Partial Copy sandboxes nobody refreshed in a year.",
          "How much your invoices rose against the same period last year, and what increase you will accept.",
        ],
      },
      {
        heading: "Why the notice date matters",
        paragraphs: [
          "Seat counts can't be reduced during a term. If the notice date passes, the contract renews at the same quantities, so seats you deactivated still cost money for another year.",
        ],
      },
    ],
    faq: [
      [
        "How long is Salesforce's renewal notice period?",
        "It is set in your order form; check there rather than assuming. Start the review at least 90 days before the contract ends so the list is ready in time.",
      ],
    ],
    related: ["how-to-reduce-salesforce-license-costs", "do-frozen-salesforce-users-use-a-license", "find-inactive-salesforce-users"],
  },
  {
    slug: "salesforce-core-advanced-max-editions",
    title: "Salesforce Core, Advanced and Max editions: what they mean for your renewal",
    description:
      "Salesforce's Core, Advanced and Max editions, what each includes, and what existing Enterprise and Unlimited customers should ask before renewal.",
    answer:
      "In September 2026 Salesforce launched three editions for Sales and Service: Core at $195, Advanced at $395 and Max at $550 per user per month, billed annually, and its pricing pages no longer show Enterprise or Unlimited. Salesforce says \"existing customer pricing on legacy editions remains unchanged\", but it hasn't said publicly for how long or what happens at renewal, so get the answer in writing from your account executive before your notice date.",
    updated: "October 19, 2026",
    sections: [
      {
        heading: "What changed",
        paragraphs: [
          "Salesforce announced Core, Advanced and Max editions for Agentforce Sales, Agentforce Service and Agentforce Industries on 3 September 2026. Salesforce compares Core with Enterprise and Advanced with Unlimited, and calls those two \"legacy\" editions. Max costs the same as the Agentforce 1 Edition, and Salesforce says Agentforce 1 customers can upgrade to Max at no extra cost. Pricing for the industry editions takes effect later in the autumn.",
          "Commentators report that Core and Advanced list prices are about 11% and 13% above the last Enterprise ($175) and Unlimited ($350) list prices. Salesforce argues the bundles are worth more because they include products many customers bought separately. Salesforce also says pricing and packaging are subject to change.",
        ],
      },
      {
        heading: "What each edition includes, according to Salesforce",
        list: [
          "All three: Agentforce, Slack with Slackbot, embedded analytics, data security features and Premier Success Plans, according to Salesforce's announcement.",
          "Core: Slack Business+, 500,000 Flex Credits per org per year and one Partial Copy sandbox. A Full Copy sandbox is extra.",
          "Advanced: everything in Core, plus Backup & Recover, Data Detect and Security Center, one Full Copy sandbox and 1 million Flex Credits per org per year. Sales adds Sales Programs; Service adds the Help Agent.",
          "Max: everything in Advanced, plus the full Agentforce for Sales or Service suite, Slack Enterprise+ and 2.75 million Flex Credits per org per year. Service adds Workforce Engagement and IT Service.",
        ],
        paragraphs: [
          "Flex Credits are allocated per org, not per user, so they don't grow with your seat count. Salesforce's Sales and Service pricing pages don't list exactly the same features under each edition, so check your quote line by line rather than relying on the edition name.",
        ],
      },
      {
        heading: "If you are on Enterprise or Unlimited today",
        paragraphs: [
          "Salesforce's announcement says existing pricing on legacy editions is unchanged. It doesn't say whether you can keep renewing Enterprise or Unlimited, for how long, or whether the usual renewal increase still applies. Advisory firms expect renewal conversations to steer customers towards the new editions, and warn that once a bundle is signed you may not be able to drop one part of it at the next renewal.",
          "If you already pay separately for Slack, Premier Success, a backup tool or a Full Copy sandbox, add those costs up before comparing them with a bundle. If you don't use them, the bundle mostly means a higher per-seat price.",
        ],
      },
      {
        heading: "Questions to ask your account executive",
        list: [
          "Can we renew on our current edition, at what price, and for how many terms? Please confirm it in the order form.",
          "What is the per-seat price for the edition you are proposing, after discount, compared with what we pay now?",
          "Which bundled items replace products we already buy, and can those separate contracts end at the same time?",
          "What counts against Flex Credits, what happens when we run out, and do unused credits roll over?",
          "Can we reduce seats at this renewal without the per-seat price being reset?",
          "Is there a cap on the increase at the following renewal?",
        ],
      },
      {
        heading: "Before the conversation",
        paragraphs: [
          "Decide how many seats you actually need first, because every edition is priced per user. Salesforce Saver's read-only scan lists inactive, frozen and unassigned seats, reads your contract end date when you connect as a user with the Manage Billing permission, and on Unlimited orgs checks whether your API calls and custom objects would fit within Enterprise limits.",
        ],
      },
    ],
    faq: [
      [
        "Do I have to move to Core, Advanced or Max at renewal?",
        "Salesforce has said existing customer pricing on legacy editions remains unchanged, but it hasn't published how long that lasts. Ask your account executive and get any commitment written into your order form.",
      ],
      [
        "Are Flex Credits per user?",
        "No. Salesforce lists them per org per year: 500,000 with Core, 1 million with Advanced and 2.75 million with Max.",
      ],
      [
        "Is Max more expensive than Agentforce 1?",
        "No. Both are listed at $550 per user per month, and Salesforce says Agentforce 1 customers can upgrade to Max at no extra cost.",
      ],
    ],
    related: ["salesforce-renewal-notice-period", "salesforce-renewal-price-increase", "salesforce-renewal-checklist"],
  },
  {
    slug: "salesforce-renewal-notice-period",
    title: "When to give Salesforce notice before renewal",
    description:
      "Salesforce subscriptions renew automatically. Where the notice period is set, what the standard terms say, what happens if you miss it, and how to find your contract end date.",
    answer:
      "Give Salesforce written notice before the deadline in your order form; if the order form doesn't set one, Salesforce's standard Main Services Agreement asks for written notice, which can be by email, at least 30 days before the subscription term ends. Without notice, the subscription renews automatically, by default for one year, at the same quantities.",
    updated: "October 19, 2026",
    sections: [
      {
        heading: "How automatic renewal works",
        paragraphs: [
          "Salesforce's published Main Services Agreement sets the subscription term in each order form. Unless the order form says otherwise, subscriptions renew automatically for one year at a time, unless either side gives written notice at least 30 days before the term ends. Purchased quantities can't be reduced during a term, and fees are non-cancellable.",
          "Two renewal details in the same clause matter for the price. Subscriptions bought at a promotional or one-off price renew at Salesforce's list price unless the order form says otherwise. And if you reduce quantities or shorten the term at renewal, Salesforce can reset the per-unit price, whatever you paid before.",
        ],
      },
      {
        heading: "Where your notice period is defined",
        paragraphs: [
          "Look in your order form first. The Main Services Agreement says that where the order form and the agreement conflict, the order form wins, so a longer notice period, a different renewal term or a price cap in the order form overrides the standard terms. Advisory firms report notice periods of 30 to 90 days are common in negotiated contracts.",
          "If you have several order forms, for example one for Sales Cloud and another for an add-on bought later, each can have its own end date. Also check which version of the agreement your order form refers to: Salesforce keeps older versions in its Legal Agreements Archive.",
        ],
      },
      {
        heading: "What happens if you miss it",
        list: [
          "The subscription renews for another term, one year by default, with the same products and quantities.",
          "Seats you deactivated during the year keep costing money, because quantities can't be reduced until the next renewal.",
          "Any increase written into your order form applies.",
          "You can still ask your account executive for changes, but they don't have to agree once the date has passed.",
        ],
      },
      {
        heading: "How to find your contract end date",
        paragraphs: [
          "In Setup, click the gear icon and choose Your Account, or open it from the App Launcher. You need the Manage Billing permission; without it, Your Account doesn't appear. The View your Contracts tile shows each contract's renewal date and how often it renews. If nobody in your company has Manage Billing, the order form or your account executive can give you the date. The same data can be queried from the read-only SalesforceContract object:",
        ],
        code: "SELECT ContractNumber, StartDate, EndDate, SalesforceContractStatus, AutoRenewCode\nFROM SalesforceContract\nORDER BY EndDate DESC",
      },
      {
        heading: "Work back from the date",
        paragraphs: [
          "Subtract the notice period from the end date and put that deadline in the calendar, then start the review about 90 days before the end date so the list of seats and apps to drop is ready in time. Salesforce Saver reads your contract end date when you connect as a user with Manage Billing, and shows the date to give notice by under the standard 30-day terms next to each saving; check your order form in case yours differs.",
        ],
      },
    ],
    faq: [
      [
        "Does Salesforce remind me before renewal?",
        "Don't rely on it. Under the standard terms the subscription renews unless one side gives notice, so put the date in your own calendar.",
      ],
      [
        "Can I give notice by email?",
        "Under the standard Main Services Agreement, yes: written notice can be sent by email. Check your order form in case it sets a different method, and keep a copy of what you sent.",
      ],
      [
        "Do I have to cancel to reduce seats?",
        "No. Tell your account executive in writing before the notice date which quantities you want at renewal. Expect the per-seat price to be discussed again, because the standard terms let Salesforce reset it when quantities go down.",
      ],
    ],
    related: ["salesforce-renewal-checklist", "salesforce-renewal-price-increase", "how-to-reduce-salesforce-license-costs"],
  },
  {
    slug: "salesforce-renewal-price-increase",
    title: "How much can Salesforce raise your price at renewal?",
    description:
      "What Salesforce's contract says about renewal pricing, the list price rises it has announced, what advisory firms say is typical, and how to get a written cap.",
    answer:
      "Salesforce's standard contract sets no maximum: its Main Services Agreement says promotional or one-time prices renew at the list price in effect at renewal, and a renewal with fewer seats or a shorter term can be re-priced without regard to the old per-unit price. The only cap is one written into your order form, so check for an uplift clause and, if there isn't one, ask for a cap in writing before your notice date.",
    updated: "October 19, 2026",
    sections: [
      {
        heading: "What the contract says",
        paragraphs: [
          "Salesforce's Main Services Agreement (last updated September 15, 2025) is the base contract behind most order forms. Unless your order form says otherwise:",
        ],
        list: [
          "Subscriptions renew automatically for one year unless either side gives written notice at least 30 days before the term ends.",
          "Promotional or one-time priced subscriptions renew at Salesforce's list price in effect at renewal.",
          "If you renew fewer seats or a shorter term, the renewal can be re-priced \"without regard to the prior term's per-unit pricing\".",
          "Quantities can't be decreased during a subscription term.",
          "The agreement states no maximum renewal increase. Any cap is in your order form or nowhere.",
        ],
      },
      {
        heading: "List price rises Salesforce has announced",
        paragraphs: [
          "A list price rise reaches you most directly when your subscription renews at list price, for example after a promotional first term, or when your order form has no cap. Salesforce's two most recent announcements:",
        ],
        list: [
          "August 2023: list prices rose an average of 9% across Sales Cloud, Service Cloud, Marketing Cloud, Industries and Tableau, for new customers and existing customers buying new clouds.",
          "August 1, 2025: list prices rose an average of 6% for Enterprise and Unlimited editions of Sales Cloud, Service Cloud, Field Service and select Industries Clouds. Salesforce said Foundations, Starter and Pro editions were not changing.",
        ],
      },
      {
        heading: "What advisory firms report",
        paragraphs: [
          "Salesforce doesn't publish a typical renewal increase. Advisory firms Redress Compliance and LowCode Agency both say order forms typically allow an annual uplift of 8 to 10%, and both suggest negotiating a cap of 3 to 5%. LowCode Agency estimates that uplift plus list price changes can raise a contract's value by 15 to 40% over three years. Redress claims customers who renew in Salesforce's fourth quarter typically get 15 to 25% better pricing, without citing data. Treat all of these as those firms' claims, not Salesforce terms.",
        ],
      },
      {
        heading: "How to negotiate the increase",
        list: [
          "Read your order form for an uplift or price protection clause, and note the notice date. Without notice, subscriptions renew automatically.",
          "Ask for a cap on the per-unit price for the renewal term, in writing in the order form. A verbal promise from an account executive doesn't bind the renewal.",
          "Decide which unused seats, apps and sandboxes to drop first, and agree the per-unit price for the smaller quantity at the same time, because the contract lets Salesforce re-price a renewal with fewer seats.",
          "Mind the timing: Salesforce's fiscal year ends January 31, so November to January is its fourth quarter. Redress advises starting preparation in October.",
        ],
      },
      {
        heading: "Check what you actually paid",
        paragraphs: [
          "Compare this year's invoices with the same period last year; with the Manage Billing permission you can see them in Setup under Your Account. Salesforce Saver reads your Salesforce invoices, shows how much they rose against a year ago, and lists the seats you could drop before renewal.",
        ],
      },
    ],
    faq: [
      [
        "Is there a standard cap on Salesforce renewal increases?",
        "No. Salesforce's Main Services Agreement states no maximum, so a cap only exists if your order form includes one.",
      ],
      [
        "Can dropping seats raise my price per seat?",
        "It can. The agreement lets Salesforce re-price a renewal with fewer seats or a shorter term without regard to the previous per-unit price, so agree the new per-unit price in writing when you reduce quantities.",
      ],
      [
        "Did the August 2025 price rise apply to every edition?",
        "No. Salesforce said it applied to Enterprise and Unlimited editions of Sales Cloud, Service Cloud, Field Service and select Industries Clouds, with no planned changes for Foundations, Starter or Pro editions.",
      ],
    ],
    related: ["salesforce-renewal-checklist", "salesforce-renewal-notice-period", "how-to-reduce-salesforce-license-costs"],
  },
  {
    slug: "salesforce-sandbox-cost",
    title: "What a Salesforce sandbox really costs",
    description:
      "Which Salesforce sandboxes come with your edition, how paid sandboxes are priced as a share of your spend, how to list them with their last refresh, and when to drop one.",
    answer:
      "Developer sandboxes are included with Salesforce CRM licenses, while paid sandboxes are priced as a share of what you spend: Salesforce lists Developer Pro at 5%, Partial Copy at 20% and Full Copy at 30% of net spend. Enterprise Edition includes one Partial Copy and Unlimited and Performance include one Full Copy as well, so any sandbox beyond that is a paid add-on on your order form.",
    updated: "October 19, 2026",
    sections: [
      {
        heading: "Sandbox types and what each edition includes",
        paragraphs: [
          "Salesforce's sandbox guide lists these types and allowances. They can change, so check the Sandboxes page in Setup, which shows how many you have bought and how many are still available.",
        ],
        list: [
          "Developer: metadata only, 200 MB of data, can be refreshed every day. 10 included with Professional, 25 with Enterprise, 100 with Unlimited and Performance.",
          "Developer Pro: metadata only, 1 GB of data, can be refreshed every day. 5 included with Unlimited and Performance; extra ones can be bought for any edition.",
          "Partial Copy: metadata plus a sample of production data, 5 GB, can be refreshed every 5 days. 1 included with Enterprise, Unlimited and Performance; not available on Professional.",
          "Full Copy: metadata plus all production data, can be refreshed every 29 days. 1 included with Unlimited and Performance; can be bought for Enterprise; not available on Professional.",
        ],
      },
      {
        heading: "How paid sandboxes are priced",
        paragraphs: [
          "Salesforce's sandbox pricing page lists Developer Pro at 5%, Partial Copy at 20% and Full Copy at 30% of net spend, meaning a percentage of what you spend on other applicable Salesforce products. Because the price is a share of your spend, it rises when your spend does. As an illustration, at 30% a Full Copy on $100,000 a year of applicable spend would be $30,000 a year. Salesforce says the page is for information only, so the figure that counts is the one on your order form.",
        ],
      },
      {
        heading: "How to list your sandboxes and their last refresh",
        paragraphs: [
          "In Setup, enter Sandboxes in Quick Find. The list shows each sandbox and its status, and the Sandbox History tab logs creations and refreshes from the last year, up to 500 entries. To get the same data with SOQL, query the SandboxInfo and SandboxProcess objects through the Tooling API from your production org:",
        ],
        code: "SELECT SandboxName, LicenseType, Description FROM SandboxInfo\n\nSELECT SandboxName, LicenseType, EndDate\nFROM SandboxProcess\nWHERE Status = 'Completed'\nORDER BY EndDate DESC",
      },
      {
        heading: "When to drop one",
        list: [
          "A Full Copy or Partial Copy nobody has refreshed in a year is rarely used for testing. Confirm with your team before deleting it.",
          "Sandboxes your edition includes cost nothing extra, so dropping them saves nothing.",
          "A deleted sandbox can't be recovered, and deleting it also erases outbound change sets uploaded from it. Delete is only available once the sandbox's refresh interval has passed.",
          "Deleting a sandbox doesn't end its subscription. To stop paying, reduce the sandbox quantity at renewal, before the notice date in your order form.",
        ],
      },
      {
        heading: "Checking by hand or with a scan",
        paragraphs: [
          "The Setup list and the queries above are enough to check by hand. Salesforce Saver lists your sandboxes through the Tooling API, flags Full Copy and Partial Copy sandboxes not refreshed in a year beyond the ones your edition includes, and prices them once you add your sandbox price.",
        ],
      },
    ],
    faq: [
      [
        "Is a Developer sandbox free?",
        "Yes. Salesforce lists Developer sandboxes as included with CRM licenses, from 10 on Professional to 100 on Unlimited and Performance.",
      ],
      [
        "Does deleting a sandbox lower my bill?",
        "Not by itself. The sandbox license stays on your contract, so you can create a new sandbox in its place. Your bill only drops when you reduce the sandbox quantity at renewal.",
      ],
    ],
    related: ["how-to-reduce-salesforce-license-costs", "salesforce-renewal-checklist", "salesforce-renewal-price-increase"],
  },
  {
    slug: "deactivate-salesforce-user-without-losing-data",
    title: "How to remove a Salesforce user without losing their data",
    description:
      "Salesforce users can't be deleted, only deactivated. Their records stay. What blocks deactivation, how to reassign ownership, and how to reuse the license.",
    answer:
      "You can't delete a Salesforce user; you deactivate them instead, and every record they own stays in the org with them as owner until you transfer it. Deactivation stops the login and frees the license for someone else, so the usual order is freeze, reassign, then deactivate.",
    updated: "October 19, 2026",
    sections: [
      {
        heading: "What deactivation keeps and what it changes",
        list: [
          "Records they own stay put and keep them as owner until you transfer them. Their history and activity stay too.",
          "They stay in the user list as inactive and in public groups, and their own default account and opportunity teams are left as they were.",
          "They are removed from other users' default account and opportunity teams, and lose access to records shared with them manually or as a team member.",
          "Files they own and Chatter groups they own stay theirs until an admin reassigns them.",
          "Permission set assignments stay on the inactive user; Salesforce recommends removing them.",
        ],
      },
      {
        heading: "What stops you deactivating someone",
        paragraphs: ["Salesforce won't deactivate a user who is:"],
        list: [
          "The default lead owner or default lead creator, or the default or automated case owner.",
          "The default workflow user, or the only recipient of a workflow email alert.",
          "Selected in a custom hierarchy field (such as a manager field).",
          "A Customer Portal Administrator.",
        ],
      },
      {
        heading: "Freeze first, then clean up",
        paragraphs: [
          "Freezing blocks the login straight away but keeps the license assigned. Use it on the day someone leaves, then work through the clean-up before you deactivate:",
        ],
        list: [
          "Fix the blockers above and remove the user from approval processes, or give their approvals to someone else.",
          "Change the owner and running user of any dashboard they own, or it may not show the expected results.",
          "Transfer their records. Mass Transfer Records in Setup moves accounts, leads, service contracts and custom object records, up to 250 at a time; transferring an account can also move its contacts, open activities, opportunities and cases. For more records, update the owner with Data Loader.",
          "Transfer ownership before deactivating if they own more than 10,000 records of one object, to avoid performance problems. Processes built in Process Builder also can't update records owned by inactive users.",
          "Check for integrations that log in as them. A deactivated user can't log in, through the API either, so move each tool to a dedicated integration user and test it first. Connected Apps OAuth Usage in Setup shows which apps each user has authorised.",
        ],
      },
      {
        heading: "Count what they own",
        paragraphs: ["Run a count per object before you transfer, replacing the Id with the user's:"],
        code: "SELECT COUNT() FROM Account WHERE OwnerId = '005XXXXXXXXXXXXXXX'\nSELECT COUNT() FROM Opportunity WHERE OwnerId = '005XXXXXXXXXXXXXXX' AND IsClosed = false\nSELECT COUNT() FROM Case WHERE OwnerId = '005XXXXXXXXXXXXXXX' AND IsClosed = false",
      },
      {
        heading: "Reusing the license",
        paragraphs: [
          "A deactivated user no longer counts against your available licenses, so you can give the seat to a new starter instead of buying another. Your bill doesn't change until you lower the license count, which in practice means at renewal, before the notice date in your order form. Salesforce Saver lists frozen and inactive users still holding a paid seat, so you know who to work through.",
        ],
      },
    ],
    faq: [
      [
        "Can I delete a Salesforce user?",
        "No. Salesforce only lets you deactivate users, so their records and history aren't orphaned. You need the Manage Internal Users permission to deactivate.",
      ],
      [
        "Do I have to transfer records before deactivating?",
        "Not always; records keep the inactive user as owner. Transfer them if someone needs to work them, if processes update them, or if the user owns more than 10,000 records of one object.",
      ],
      [
        "Does freezing a user free the license?",
        "No. Freezing only blocks the login. Deactivate the user to free the license.",
      ],
    ],
    related: ["do-frozen-salesforce-users-use-a-license", "find-inactive-salesforce-users", "salesforce-integration-user-license"],
  },
  {
    slug: "unused-service-cloud-licenses",
    title: "Do you need Service Cloud licenses if nobody works cases?",
    description:
      "What the Service Cloud User feature license gives, how to find who holds it, and how to check with SOQL whether they work cases before your renewal.",
    answer:
      "Probably not. The Service Cloud User feature license is what gives someone the Service Console; a user who doesn't work cases in the console doesn't need it, and Cases themselves are a standard CRM object that full Salesforce users can be given access to through their profile. Check who holds the license and whether they touched a Case recently, then buy fewer at renewal.",
    updated: "October 19, 2026",
    sections: [
      {
        heading: "What the Service Cloud User license gives",
        paragraphs: [
          "Salesforce describes the Service Cloud User feature license as entitling users to \"additional Salesforce features, such as the Service Console\". In its list of feature licenses the entry reads \"Access the Salesforce Console for Service\". Knowledge is a separate feature license (Knowledge User), and the Sales Console needs its own Sales Console User permission set license.",
          "Without it, a user on a full Salesforce license still has standard CRM objects, and Salesforce Ben describes Sales Cloud as including \"some very basic case management features\". Whether a given user can read, create or edit Cases depends on their profile and permission sets, so check those rather than assuming.",
        ],
      },
      {
        heading: "Who holds it",
        paragraphs: ["The license shows as the Service Cloud User checkbox on the user record, and in SOQL as UserPermissionsSupportUser:"],
        code: "SELECT Id, Name, Profile.Name, LastLoginDate\nFROM User\nWHERE IsActive = true\n  AND UserPermissionsSupportUser = true",
      },
      {
        heading: "Do they work cases?",
        paragraphs: [
          "Count the Cases each person created or last edited in the last 90 days. Anyone on the list above who appears in neither result is a candidate to lose the license:",
        ],
        code: "SELECT CreatedById, COUNT(Id)\nFROM Case\nWHERE CreatedDate = LAST_N_DAYS:90\nGROUP BY CreatedById\n\nSELECT LastModifiedById, COUNT(Id)\nFROM Case\nWHERE LastModifiedDate = LAST_N_DAYS:90\nGROUP BY LastModifiedById",
      },
      {
        heading: "Before you remove it",
        list: [
          "Skip people who joined recently or who cover the service team only at busy times.",
          "If you use Omni-Channel, check the UserServicePresence object too: it records agents' presence status, so you can see who goes online to take work even if they rarely edit a Case.",
          "Ask the person and their manager whether they use the console for anything else, such as a custom console app.",
        ],
      },
      {
        heading: "At renewal",
        paragraphs: [
          "Untick Service Cloud User on the users who don't need it, then compare the number still assigned with the quantity on your order form. If Service Cloud User is a separate line, ask your account executive to reduce it before the notice date. If it comes bundled with your main licenses, there is nothing to save on that line. Salesforce Saver flags users with the license who created or edited no Cases in 90 days, and prices them at what you tell it you pay per Service Cloud User.",
        ],
      },
    ],
    faq: [
      [
        "Can a user without the Service Cloud User license see Cases?",
        "Yes, if their profile or permission sets give access to Cases. The feature license adds the Service Console, not access to the Case object itself.",
      ],
      [
        "How do I remove the Service Cloud User license from someone?",
        "In Setup, open Users, click Edit next to the user, untick Service Cloud User and save. You need the Manage Internal Users permission.",
      ],
    ],
    related: ["salesforce-platform-license-vs-full-license", "salesforce-renewal-checklist", "how-to-reduce-salesforce-license-costs"],
  },
  {
    slug: "same-user-in-two-salesforce-orgs",
    title: "Paying for the same person in two Salesforce orgs",
    description:
      "Companies with more than one production org often license the same people in each. How to find the overlap and stop paying twice.",
    answer:
      "Each Salesforce org has its own users and its own licenses, so someone with a login in two production orgs takes a paid seat in both. Export the active users from each org, match them by email, and for each person who only works in one org, deactivate them in the other and drop that seat at renewal.",
    updated: "October 19, 2026",
    sections: [
      {
        heading: "Why it happens",
        paragraphs: [
          "Second orgs usually arrive with an acquisition, or because a country, division or department set up its own. Managers, finance, support and admin teams then get a login in each org so they can see everything, and nobody removes the one they stop using.",
          "A license is assigned to a user in one org; it doesn't follow the person to another org. A Salesforce Developers blog post on multi-org strategy notes that licensing costs go up when users need access to more than one org.",
        ],
      },
      {
        heading: "Find the overlap",
        paragraphs: [
          "Usernames are unique across all Salesforce orgs, so the same person has a different username in each one. Match on email address instead. Run this in each org and export the results:",
        ],
        code: "SELECT Name, Username, Email, Profile.UserLicense.Name, LastLoginDate\nFROM User\nWHERE IsActive = true\n  AND UserType = 'Standard'\nORDER BY Email",
      },
      {
        heading: "Decide which seat to keep",
        list: [
          "Lower-case the emails and match them in a spreadsheet. Also check names, since some people use a different email domain in each org.",
          "For each match, compare last login and whether they created or edited records recently in each org. The org where they do the work keeps the seat.",
          "If they only log in to the other org to look something up, deactivate them there and share reports or dashboards from the org they still use.",
          "Reassign records the user owns and check flows, approvals and default owner settings before deactivating, as you would for anyone leaving.",
        ],
      },
      {
        heading: "If people really need data from both orgs",
        paragraphs: [
          "Salesforce Connect's cross-org adapter lets one org read data held in another Salesforce org as external objects, through the REST API, without copying it. Salesforce Connect is usually sold as an add-on license, so compare its price with the seats it would replace.",
          "Merging the orgs removes the duplicate seats for good, but it is a large project: the same Salesforce post describes consolidating different processes and data models into one org as usually very complicated. Treat it as a long-term option, not a quick saving.",
        ],
      },
      {
        heading: "When the saving lands",
        paragraphs: [
          "Deactivating a duplicate user frees the seat straight away, so you don't buy another for the next starter. Advisory firms report that Salesforce seats can only be cut at renewal, so take the list of seats to drop in each org to your account executive before the notice date in each order form. If both orgs are connected, Salesforce Saver matches paid users by email across them and flags people who work in one org but created or edited nothing in the other for 90 days.",
        ],
      },
    ],
    faq: [
      [
        "Can one Salesforce license cover a user in two orgs?",
        "No. Licenses are assigned to a user in a specific org, and each org has its own user records, so a person with a login in both orgs uses a seat in each.",
      ],
      [
        "Does deactivating someone in one org affect their access to the other?",
        "No. The orgs have separate user records, so deactivating the user in one leaves their login and records in the other untouched.",
      ],
      [
        "Are the two orgs on the same contract?",
        "Don't assume so. Check the order forms for each org to find its renewal date and notice period before planning when to drop seats.",
      ],
    ],
    related: ["find-inactive-salesforce-users", "deactivate-salesforce-user-without-losing-data", "salesforce-renewal-checklist"],
  },
  {
    slug: "find-unused-salesforce-apps",
    title: "How to find unused AppExchange and connected apps in Salesforce",
    description:
      "Check installed packages, their seat assignments and connected app usage to find Salesforce apps nobody uses, then cancel them with the vendor.",
    answer:
      "Open Setup > Installed Packages to see each AppExchange app with its allowed and used licenses, then open Connected Apps OAuth Usage to see when each connected app was last used and by how many people. An app with no recent use or with seats held by inactive users is a candidate to cancel, but uninstalling it doesn't end the subscription: cancel with the vendor or through AppExchange before it renews.",
    updated: "October 19, 2026",
    sections: [
      {
        heading: "Installed packages and their seats",
        paragraphs: [
          "In Setup, enter Installed Packages in the Quick Find box. For licensed managed packages the page shows Allowed Licenses, Used Licenses, the expiration date and the status (Trial, Active, Suspended, Expired or Free). Manage Licenses lists who holds each seat; packages with a site license don't have one, because every user gets access.",
          "The same data is in two objects. PackageLicense holds the seat counts per package, and UserPackageLicense holds one row per assigned user:",
        ],
        code: "SELECT NamespacePrefix, Status, AllowedLicenses, UsedLicenses\nFROM PackageLicense\n\nSELECT PackageLicense.NamespacePrefix, User.Name, User.IsActive, User.LastLoginDate\nFROM UserPackageLicense\nORDER BY PackageLicense.NamespacePrefix, User.LastLoginDate",
      },
      {
        heading: "Connected apps and when they were last used",
        paragraphs: [
          "In Setup, enter OAuth in the Quick Find box and select Connected Apps OAuth Usage. It lists apps with an active token and how many users use each one; click the user count to see when each person first used the app, when they last used it and how many times. The OauthToken object holds the same detail:",
        ],
        code: "SELECT AppName, UserId, UseCount, LastUsedDate\nFROM OauthToken\nORDER BY AppName, LastUsedDate",
      },
      {
        heading: "Signs an app is unused",
        list: [
          "No record created or edited in the package's own objects for 90 days or more.",
          "Package seats assigned to users who are inactive, frozen or haven't logged in for 30 days.",
          "Allowed Licenses well above Used Licenses, so you pay for seats nobody holds.",
          "A connected app whose most recent use was months ago, or whose only users have left.",
          "Two apps that do the same job, such as two e-signature or document tools.",
        ],
      },
      {
        heading: "Check the contract, then cancel before you uninstall",
        paragraphs: [
          "Find how each app is billed: through AppExchange Checkout, on your Salesforce order form, or directly by the vendor. The term and notice period can differ for each. For AppExchange Checkout subscriptions, a user with the Manage Billing permission ends them under My Installs & Subscriptions, and Salesforce says the cancellation takes effect at the end of the contract term. For the others, give notice as the vendor contract requires.",
          "Uninstalling is a separate step. It removes the package's components and data from the org; Salesforce emails an export of the package data that is deleted two days after the uninstall. Salesforce's uninstall instructions say nothing about subscriptions, and vendors such as Fastcall tell customers to cancel their subscription before uninstalling.",
        ],
      },
      {
        heading: "Doing it by hand or with a scan",
        paragraphs: [
          "Salesforce Saver reads the same data in one read-only scan: it flags installed packages with no record created or edited in their objects for 90 days, unassigned package seats, and connected apps unused for 90 days, and prices each from a public list price where it has one, or from the price you enter.",
        ],
      },
    ],
    faq: [
      [
        "Does uninstalling an AppExchange app stop the bill?",
        "Not on its own. Uninstalling removes the app from the org; the subscription has to be cancelled through AppExchange or with the vendor, and cancellation usually takes effect at the end of the term.",
      ],
      [
        "Can I free a package seat without cancelling the app?",
        "Usually. Manage Licenses, next to the package under Installed Packages, is where seats are assigned to users, so you can move one from someone who doesn't use the app to a new user. Check the vendor contract for when you can lower the number of seats you pay for.",
      ],
      [
        "What happens to the app's data when I uninstall?",
        "It is deleted from the org with the package. Salesforce creates an export file and emails a link to the person who uninstalled it; save it elsewhere, because the file is deleted two days later.",
      ],
    ],
    related: ["how-to-reduce-salesforce-license-costs", "salesforce-renewal-checklist", "find-inactive-salesforce-users"],
  },
  {
    slug: "salesforce-license-types",
    title: "Salesforce license types explained, and where the savings are",
    description:
      "The main Salesforce user licenses, permission set licenses and feature licenses, what each is for, and which swaps usually cost less.",
    answer:
      "Every Salesforce user has exactly one user license, which sets what they can do; permission set licenses and feature licenses add features on top. Most savings come from four swaps: Salesforce Platform instead of a full CRM license for people who don't work Leads, Opportunities or Cases, the Salesforce Integration license for API-only users, login-based instead of member-based Experience Cloud licenses for occasional portal users, and Chatter Free for people who only need Chatter.",
    updated: "October 20, 2026",
    sections: [
      {
        heading: "The main user licenses",
        list: [
          "Salesforce (full CRM): for users who need full access to standard CRM objects and apps. Salesforce's Sales Cloud pricing page lists Core at $195 per user per month, billed annually.",
          "Salesforce Platform: for users who need custom apps but not standard CRM objects such as Leads and Opportunities. Salesforce lists Platform Starter at $25 (10 custom objects) and Platform Plus at $100 (110 custom objects) per user per month, billed annually. A Salesforce Platform Login license gives the same features billed per login, for occasional users.",
          "Salesforce Integration: API access only, for system-to-system integrations. Enterprise, Unlimited and Performance editions include five.",
          "Chatter Free: for people with no Salesforce license who need Chatter people, profiles, groups and files, but no Salesforce records. Chatter External is for people outside your email domain, who only see the groups they are invited to.",
          "Experience Cloud (portal) licenses for external users: Customer Community for business-to-consumer sites with cases and knowledge, Customer Community Plus when external users also need reports, dashboards and standard sharing, and Partner Community for partner sites that need sales data. Each can be member-based or login-based.",
        ],
      },
      {
        heading: "Permission set licenses and feature licenses",
        paragraphs: [
          "A permission set license adds functionality on top of a user license, and one user can hold several. Many paid add-ons, such as Service Cloud Einstein in Salesforce's own example, are permission set licenses; others come with a user license, like the Salesforce API Integration permission set license used with the Integration user license. Setup shows how many of each you have and how many are assigned.",
          "Feature licenses are switched on per user with a checkbox on the user record and give access to one feature, such as Marketing User (campaigns), Knowledge User, Flow User or Service Cloud User (the Service Console). Whether a feature license costs extra depends on your contract, so check your order form.",
        ],
      },
      {
        heading: "Swaps that usually save money",
        list: [
          "Full license to Platform: people who only use Accounts, Contacts, activities and custom apps. The Platform vs full license guide covers who fits and how to check.",
          "Full license to Integration: any integration logging in as a full user can usually move to one of the free Integration licenses.",
          "Member to login-based portal licenses: Salesforce's add-on price sheet lists Customer Community at $5 a member or $2 a login a month, Customer Community Plus at $15 or $6, and Partner (PRM) at $25 or $10. Several logins by one user on the same day count as one, so at those list prices login-based is cheaper for anyone who logs in on 2 days a month or fewer.",
          "Full or Platform license to Chatter Free: only for people who never need Salesforce records, just Chatter groups, profiles and files. An existing user can't be converted to Chatter Free, so this means a new Chatter Free user and deactivating the old one.",
          "Paid permission set licenses nobody holds, or held by people who have left: drop them at renewal like unused seats.",
        ],
      },
      {
        heading: "See what you have",
        paragraphs: [
          "The first query counts active users per user license. The second shows how many of each user license and permission set license you have and how many are assigned; the gap is what you pay for and don't use:",
        ],
        code: "SELECT Profile.UserLicense.Name, COUNT(Id)\nFROM User\nWHERE IsActive = true\nGROUP BY Profile.UserLicense.Name\n\nSELECT Name, TotalLicenses, UsedLicenses\nFROM UserLicense\nORDER BY Name\n\nSELECT MasterLabel, TotalLicenses, UsedLicenses\nFROM PermissionSetLicense\nORDER BY MasterLabel",
      },
      {
        heading: "Checking it by hand or with a scan",
        paragraphs: [
          "Each swap needs a look at what people actually do: which objects they edit, how often they log in, whether a login belongs to a person or a tool. Salesforce Saver checks full-license users who fit Platform or Integration licenses and unassigned Salesforce and Platform seats in one read-only scan, and lists every user and permission set license with how many are assigned.",
        ],
      },
    ],
    faq: [
      [
        "Can a Salesforce user have more than one license?",
        "Each user has exactly one user license, but can hold several permission set licenses and feature licenses on top of it.",
      ],
      [
        "When is a login-based Experience Cloud license cheaper?",
        "At Salesforce's list prices a member license costs 2.5 times a monthly login, so login-based is cheaper for users who log in on 2 days a month or fewer. Logins are bought per month, unused ones roll over to the next month, and use is measured over the 12-month contract, so check the block size in your order form.",
      ],
      [
        "Is Chatter Free a cheaper Salesforce license?",
        "It is a different kind of license: Chatter Free users can't see any Salesforce records. It only suits people who just need Chatter groups, profiles and files.",
      ],
    ],
    related: ["salesforce-platform-license-vs-full-license", "salesforce-integration-user-license", "how-to-reduce-salesforce-license-costs"],
  },
  {
    slug: "buy-salesforce-through-aws-marketplace",
    title: "Buying Salesforce through AWS Marketplace to use your AWS commitment",
    description:
      "Salesforce sells through AWS Marketplace by private offer. When the listing is Deployed on AWS, the spend can count toward an AWS commitment (EDP or private pricing agreement), within the cap in your AWS contract.",
    answer:
      "Yes: Salesforce sells products such as Sales Cloud, Service Cloud, Data Cloud and Agentforce through AWS Marketplace, and when the listing is marked \"Deployed on AWS\" the spend can count toward an AWS spend commitment (EDP or private pricing agreement). The Salesforce price isn't lower there; the saving is paying Salesforce with AWS money you have already committed and would otherwise leave unused.",
    updated: "October 20, 2026",
    sections: [
      {
        heading: "What Salesforce lists on AWS Marketplace",
        paragraphs: [
          "Salesforce started selling through AWS Marketplace in the US in November 2023, with Sales Cloud, Service Cloud, Data Cloud, Industry Clouds, Platform, Tableau, MuleSoft and Heroku, and has since added countries including the UK, several EU countries, Australia, Canada and India. Its own listings, such as Agentforce and Agentforce Sales, are sold by Salesforce, Inc., show \"Deployed on AWS: Yes\" and have custom pricing: there is no public price, you request a private offer and the charges appear on your AWS bill.",
        ],
      },
      {
        heading: "When it counts toward your AWS commitment",
        list: [
          "Only SaaS listings marked \"Deployed on AWS\" count. The rule applies to invoices dated from May 1, 2025, whenever the deal was signed; earlier invoices keep counting.",
          "The amount that counts is capped. Cloud cost advisers Duckbill report that under AWS's 2022 terms Marketplace spend counts in full but only up to 25% of the annual commitment, while contracts signed before 2022 counted 50% of Marketplace spend. That is their summary, not an AWS document, so check the cap in your own AWS agreement.",
          "Professional services bought through Marketplace don't count.",
          "Check the badge on each listing. Some partner listings that mention Salesforce are not Deployed on AWS, and those purchases won't reduce your commitment.",
        ],
      },
      {
        heading: "Private offers and reseller quotes",
        paragraphs: [
          "A private offer is a price and set of terms the seller makes for your AWS account only: you negotiate with the seller, accept the offer in AWS Marketplace, and pay on your AWS bill. Salesforce can make one directly. Authorised resellers can make a channel partner private offer (CPPO) on terms Salesforce has approved; AWS's documentation shows the reseller starts from Salesforce's terms and can add a markup, so a reseller quote is a negotiation, not a guaranteed discount. Apps that work with Salesforce, such as Conga, are sold the same way and also count when their listing is Deployed on AWS.",
        ],
      },
      {
        heading: "What to ask before your renewal notice date",
        list: [
          "Ask your AWS account team how much of your commitment you expect to leave unused this year, what share of Marketplace spend counts under your agreement, and whether the Salesforce listing qualifies.",
          "Ask your Salesforce account executive for an AWS Marketplace private offer for the renewal, at the same products, quantities and price you are negotiating anyway.",
          "Check that the listing the offer comes from shows Deployed on AWS, and that the offer's start date lines up with your renewal date.",
          "Do this before the notice date in your order form. Salesforce subscriptions can't be reduced mid-term, so the switch is a renewal-time move.",
        ],
      },
      {
        heading: "What it's worth",
        paragraphs: [
          "The saving is at most the smallest of your Salesforce bill, the Marketplace cap in your AWS agreement, and the commitment you'd otherwise leave unused. If you will use your whole AWS commitment anyway, the gain is billing in one place, not money. Salesforce Saver shows this as a buying option on the contract card, worked out from your invoices and the AWS numbers you enter, and lists the apps you use that are sold on AWS Marketplace so you can ask resellers to quote them; it isn't added to the savings total.",
        ],
      },
    ],
    faq: [
      [
        "Is Salesforce cheaper on AWS Marketplace?",
        "Not by itself. Prices are set in a private offer you negotiate with Salesforce or a reseller. The saving comes from counting the bill toward an AWS commitment you would otherwise not use in full.",
      ],
      [
        "Does all Marketplace spend count toward an AWS EDP?",
        "No. Only listings marked Deployed on AWS count for invoices from May 1, 2025, professional services never count, and the share that counts is capped by your AWS agreement.",
      ],
      [
        "Can I move my Salesforce contract to AWS Marketplace mid-term?",
        "Plan it for renewal. Salesforce quantities and fees are fixed for the term, so ask for the private offer before your renewal notice date.",
      ],
    ],
    related: ["buy-salesforce-through-google-cloud-or-azure", "salesforce-renewal-notice-period", "salesforce-renewal-checklist"],
  },
  {
    slug: "buy-salesforce-through-google-cloud-or-azure",
    title: "Can you buy Salesforce through Google Cloud or Microsoft Azure?",
    description:
      "What Salesforce lists on Google Cloud Marketplace and Azure Marketplace today, how commit drawdown and MACC work, and where the apps around Salesforce can still count toward your commitment.",
    answer:
      "Not for core Sales Cloud or Service Cloud licences yet. On Google Cloud Marketplace, Salesforce names one listing, Agentforce Sales Agent for Gemini Enterprise, in beta; on Azure Marketplace, the Salesforce listing we found is a single sign-on app that needs an existing subscription. Some apps you use with Salesforce, such as Docusign on Azure, can count toward those commitments.",
    updated: "October 20, 2026",
    sections: [
      {
        heading: "Google Cloud Marketplace",
        paragraphs: [
          "In February 2025 Salesforce said Agentforce, Data Cloud and Customer 360 apps will run on Google Cloud, and that once they do, customers will be able to buy them through Google Cloud Marketplace. It gave no date. In September 2026 it listed Agentforce Sales Agent for Gemini Enterprise as in beta on Google Cloud Marketplace, and said Hyperforce on Google Cloud is planned to be generally available in North America in November 2026, with more regions in 2027. It didn't say Sales Cloud or Service Cloud licences can be bought there.",
        ],
      },
      {
        heading: "How Google commit drawdown works",
        paragraphs: [
          "Google's documentation says 100% of spend on Google Cloud Marketplace counts toward a Google Cloud commitment, with exclusions. The ones that matter here: products that don't run on Google Cloud, professional services, and purchases through a reseller when the vendor hasn't opted into Google's resale program. Google tells buyers to ask the vendor which of its products run on Google Cloud, so ask Salesforce that before counting on it.",
        ],
      },
      {
        heading: "Azure Marketplace and MACC",
        paragraphs: [
          "Microsoft's marketplace lists Salesforce as an Entra ID app for single sign-on and user provisioning, published by Salesforce, with no price; it requires an existing Salesforce subscription and isn't marked Azure benefit eligible. We found no Salesforce licence for sale there.",
          "If you have a Microsoft Azure Consumption Commitment (MACC), partner offers marked \"Azure benefit eligible\" count at 100% of the pre-tax amount. Buy through the Azure portal with a subscription tied to your company's agreement: card purchases on the marketplace website and purchases paid with Azure prepayment don't count. Docusign says eSignature, CLM and Intelligent Agreement Management can be bought against MACC.",
        ],
      },
      {
        heading: "What to ask",
        list: [
          "Salesforce: is anything you are renewing, such as Agentforce or Data Cloud, sold on Google Cloud Marketplace in your country, and does it run on Google Cloud?",
          "Google or Microsoft account team: how much of your commitment you expect to leave unused, and whether your agreement has exclusions or caps on marketplace spend.",
          "Vendors of the apps you use with Salesforce: is their listing Azure benefit eligible, or running on Google Cloud, and can they move your renewal to a private offer there?",
          "Ask before the renewal notice date in each order form, since terms are fixed until renewal.",
        ],
      },
      {
        heading: "Checking it against your apps",
        paragraphs: [
          "Salesforce Saver shows a Google Cloud or Azure buying option on the contract card when you tell it you have a commitment there and you use an app on its list of ones that count, such as Docusign for Azure. It counts only those apps, not Salesforce itself, up to the commitment you expect to leave unused, and doesn't add it to the savings total.",
        ],
      },
    ],
    faq: [
      [
        "Can I pay my Salesforce licences from an Azure commitment?",
        "We found no Salesforce licence on Azure Marketplace. Apps you buy alongside Salesforce, such as Docusign, can count toward MACC when the offer is Azure benefit eligible and bought through the Azure portal.",
      ],
      [
        "Is there a cap like AWS's on Google Cloud?",
        "Google's commit drawdown page says 100% of eligible Marketplace spend counts and doesn't mention a cap, but your own Google Cloud agreement decides. The bigger limit is that only products running on Google Cloud count.",
      ],
    ],
    related: ["buy-salesforce-through-aws-marketplace", "find-unused-salesforce-apps", "salesforce-renewal-notice-period"],
  },
];

/** How the guides index groups the pages. A guide missing from every topic is listed under "More guides". */
export const GUIDE_TOPICS: { title: string; slugs: string[] }[] = [
  {
    title: "Start here",
    slugs: ["how-to-reduce-salesforce-license-costs", "salesforce-license-types"],
  },
  {
    title: "Users and licences",
    slugs: [
      "find-inactive-salesforce-users",
      "do-frozen-salesforce-users-use-a-license",
      "deactivate-salesforce-user-without-losing-data",
      "salesforce-platform-license-vs-full-license",
      "salesforce-integration-user-license",
      "unused-service-cloud-licenses",
      "same-user-in-two-salesforce-orgs",
    ],
  },
  {
    title: "Apps and sandboxes",
    slugs: ["find-unused-salesforce-apps", "salesforce-sandbox-cost"],
  },
  {
    title: "Renewal and contract",
    slugs: [
      "salesforce-renewal-checklist",
      "salesforce-renewal-notice-period",
      "salesforce-renewal-price-increase",
      "salesforce-core-advanced-max-editions",
    ],
  },
  {
    title: "Ways to pay",
    slugs: ["buy-salesforce-through-aws-marketplace", "buy-salesforce-through-google-cloud-or-azure"],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** JSON-LD needs `<` escaped so a string can't close the script tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
