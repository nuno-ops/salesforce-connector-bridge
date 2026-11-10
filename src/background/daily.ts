// Netlify scheduled function (schedule in netlify.toml): reminder emails and monthly rescans for paid orgs.
// Bundled to netlify/functions/daily.mjs by scripts/build-functions.mjs.
import { runDaily } from "@/lib/daily";

export default async function handler(): Promise<Response> {
  const result = await runDaily();
  console.log("daily", JSON.stringify(result));
  return new Response(null, { status: 204 });
}
