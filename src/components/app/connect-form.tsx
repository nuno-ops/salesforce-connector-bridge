"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

/** Picks the Salesforce login host, then hands off to the OAuth start route. */
export function ConnectForm() {
  const [environment, setEnvironment] = useState("production");
  return (
    <form action="/api/salesforce/connect" method="get" className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Where do you log in?</legend>
        {[
          ["production", "Production (login.salesforce.com)"],
          ["sandbox", "Sandbox (test.salesforce.com)"],
          ["custom", "My Domain"],
        ].map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="environment"
              value={value}
              checked={environment === value}
              onChange={() => setEnvironment(value)}
              className="accent-primary"
            />
            {label}
          </label>
        ))}
      </fieldset>
      {environment === "custom" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="domain">My Domain</Label>
          <Input id="domain" name="domain" required placeholder="acme.my.salesforce.com" />
        </div>
      )}
      <Button type="submit" className="self-start">
        Connect Salesforce
      </Button>
      <p className="text-xs text-muted-foreground">
        Read-only access. We never change your data, and you can disconnect at any time.
      </p>
    </form>
  );
}
