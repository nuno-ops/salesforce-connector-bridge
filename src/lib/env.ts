import "server-only";
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
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
  STRIPE_PRICE_AUDIT: z.string().optional(),
  STRIPE_PRICE_CONSULT: z.string().optional(),
  AUDIT_ACCESS_HOURS: z.coerce.number().int().positive().default(48),
  CALENDLY_URL: z.url().default("https://calendly.com/salesforcesaver-support/30min"),
  ANTHROPIC_API_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
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
