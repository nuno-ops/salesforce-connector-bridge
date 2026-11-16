// Netlify event function: runs when a deploy finishes building and sends every sitemap page to IndexNow.
// Bundled to netlify/functions/deploy-succeeded.mjs by scripts/build-functions.mjs.
import sitemap from "@/app/sitemap";
import { submitToIndexNow } from "@/lib/indexnow";

export default async function handler(req: Request): Promise<Response> {
  const { payload } = (await req.json().catch(() => ({}))) as { payload?: { context?: string } };
  // Deploy previews and branch deploys live on netlify.app addresses; only production pages belong in search.
  if (payload?.context !== "production") return new Response(null, { status: 204 });
  const urls = sitemap().map((entry) => entry.url);
  const status = await submitToIndexNow(urls);
  console.log("indexnow", status, urls.length);
  return new Response(null, { status: 204 });
}
