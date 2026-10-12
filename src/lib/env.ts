import "server-only";
import { z } from "zod";

const DEFAULT_CALENDLY_URL = "https://calendly.com/salesforcesaver-support/30min";

/** Booking link for expert calls. Safe in prerendered pages, which build without the server secrets. */
export function calendlyUrl(): string {
  return process.env.CALENDLY_URL || DEFAULT_CALENDLY_URL;
}

const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  SALESFORCE_CLIENT_ID: z.string().min(1),
  SALESFORCE_CLIENT_SECRET: z.string().optional(),
  TOKEN_ENCRYPTION_KEY: z.string().min(1),
  BILLING_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_MONITOR: z.string().optional(),
  STRIPE_PRICE_CONSULT: z.string().optional(),
  /** How long a one-off unlock lasts; 2160 hours = 90 days. */
  AUDIT_ACCESS_HOURS: z.coerce.number().int().positive().default(2160),
  CALENDLY_URL: z.url().default(DEFAULT_CALENDLY_URL),
  ANTHROPIC_API_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  /** Read-only AWS keys for the Marketplace Discovery API. Netlify reserves the AWS_* names. */
  MARKETPLACE_AWS_ACCESS_KEY_ID: z.string().optional(),
  MARKETPLACE_AWS_SECRET_ACCESS_KEY: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Validated server environment. Parsed on first use so builds don't need secrets. */
export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Invalid environment: ${z.prettifyError(parsed.error)}`);
    }
    cached = parsed.data;
  }
  return cached;
}
