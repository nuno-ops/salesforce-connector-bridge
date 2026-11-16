import { CalendarClock } from "lucide-react";
import { CheckoutButton } from "@/components/app/upgrade-card";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";

/** Booking a call with a Salesforce specialist: shown across the app, since it's how customers get help acting on the report. */
export function ExpertCallCard({
  returnPath,
  title = "Talk to a Salesforce expert",
  description = "Go through these savings with a Salesforce specialist before your renewal, and get help with the clean-up, the renewal negotiation, or any other Salesforce work.",
  id,
}: {
  returnPath: string;
  title?: string;
  description?: string;
  id?: string;
}) {
  const e = env();
  return (
    <Card id={id} className="no-print scroll-mt-24 border-foreground">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-1.5">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4" /> {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div>
          {e.BILLING_ENABLED && e.STRIPE_PRICE_CONSULT ? (
            <CheckoutButton product="consult" returnPath={`${returnPath}${returnPath.includes("?") ? "&" : "?"}booked=1`}>
              Book a call
            </CheckoutButton>
          ) : (
            <Button asChild>
              <a href={e.CALENDLY_URL} target="_blank" rel="noreferrer">
                Book a call
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
