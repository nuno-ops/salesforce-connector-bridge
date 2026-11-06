"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

function send(payload: Record<string, string | null>) {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon?.(`/api/track`, new Blob([body], { type: "application/json" }))) return;
  fetch(`/api/track`, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => undefined);
}

/**
 * Cookie-free page views and "Book a call" clicks for our own analytics (src/app/api/track). Stores nothing in the
 * browser; the server turns IP + browser into an id that changes daily.
 */
export function AnalyticsBeacon() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    send({
      name: "page_view",
      path: pathname,
      // Only the landing page view carries where the visitor came from; later views are inside the site.
      referrer: first.current ? document.referrer || null : null,
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
    });
    first.current = false;
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (link && /calendly\.com/i.test(link.getAttribute("href") ?? "")) {
        send({ name: "book_call_clicked", path: window.location.pathname });
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
