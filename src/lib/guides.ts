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
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** JSON-LD needs `<` escaped so a string can't close the script tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
