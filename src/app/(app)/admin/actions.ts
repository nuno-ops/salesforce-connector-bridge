"use server";

import { notFound, redirect } from "next/navigation";
import sitemap from "@/app/sitemap";
import { isSiteOwner } from "@/lib/analytics/report";
import { requireUser } from "@/lib/auth";
import { submitToIndexNow } from "@/lib/indexnow";

/** Owner only: send every sitemap page to Bing through IndexNow, from the published site. */
export async function sendPagesToBingAction() {
  const user = await requireUser();
  if (!isSiteOwner(user.email)) notFound();
  const status = await submitToIndexNow(sitemap().map((entry) => entry.url));
  redirect(`/admin?indexnow=${status}`);
}
