/** AppExchange search for an app's listing, where its public price is shown. A link for people to follow, not fetched by us. */
export function appExchangeSearchUrl(appName: string) {
  return `https://appexchange.salesforce.com/appxSearchKeywordResults?keywords=${encodeURIComponent(appName)}`;
}
