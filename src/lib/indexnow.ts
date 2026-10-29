/**
 * IndexNow tells Bing (and Yandex, Seznam, Naver) which pages exist, so they crawl them without waiting to find them.
 * The key is public by design: search engines check it against /<key>.txt on our domain.
 */
export const INDEXNOW_KEY = "88a23c6998f91f03c8bc173a22783a34";

export function indexNowBody(urls: string[]) {
  const host = new URL(urls[0]).host;
  return { host, key: INDEXNOW_KEY, keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`, urlList: urls };
}

/** Returns the HTTP status; 200 and 202 both mean accepted. */
export async function submitToIndexNow(urls: string[]): Promise<number> {
  if (urls.length === 0) return 204;
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(indexNowBody(urls)),
  });
  return res.status;
}
