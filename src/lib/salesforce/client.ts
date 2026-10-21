export const SF_API_VERSION = "v62.0";

export class SalesforceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errorCode?: string,
  ) {
    super(message);
    this.name = "SalesforceError";
  }
}

/** The refresh token was rejected; the customer has to reconnect. */
export class SalesforceAuthError extends SalesforceError {
  constructor(message = "Salesforce session expired. Reconnect the org.") {
    super(message, 401, "INVALID_SESSION");
    this.name = "SalesforceAuthError";
  }
}

export interface SalesforceCredentials {
  instanceUrl: string;
  loginHost: string;
  accessToken: string;
  refreshToken: string | null;
  clientId: string;
  clientSecret?: string;
}

export interface ClientOptions {
  /** Called after a token refresh so the caller can persist the new access token. */
  onTokenRefresh?: (accessToken: string, instanceUrl: string) => Promise<void> | void;
  fetch?: typeof fetch;
}

interface QueryResponse<T> {
  totalSize: number;
  done: boolean;
  records: T[];
  nextRecordsUrl?: string;
}

/** Minimal read-only REST client with transparent token refresh and pagination. */
export class SalesforceClient {
  private readonly fetchImpl: typeof fetch;

  constructor(
    private creds: SalesforceCredentials,
    private readonly options: ClientOptions = {},
  ) {
    this.fetchImpl = options.fetch ?? fetch;
  }

  get instanceUrl() {
    return this.creds.instanceUrl;
  }

  async get<T>(path: string): Promise<T> {
    let res = await this.send(path);
    if (res.status === 401 && this.creds.refreshToken) {
      await this.refresh();
      res = await this.send(path);
    }
    if (res.status === 401) throw new SalesforceAuthError();
    if (!res.ok) throw await toError(res);
    return (await res.json()) as T;
  }

  /** Runs a SOQL query and follows `nextRecordsUrl` until every record is loaded. */
  async query<T>(soql: string, { tooling = false } = {}): Promise<T[]> {
    const base = `/services/data/${SF_API_VERSION}${tooling ? "/tooling" : ""}/query`;
    let page = await this.get<QueryResponse<T>>(`${base}?q=${encodeURIComponent(soql)}`);
    const records = [...page.records];
    while (!page.done && page.nextRecordsUrl) {
      page = await this.get<QueryResponse<T>>(page.nextRecordsUrl);
      records.push(...page.records);
    }
    return records;
  }

  private send(path: string) {
    return this.fetchImpl(new URL(path, this.creds.instanceUrl), {
      headers: { Authorization: `Bearer ${this.creds.accessToken}`, Accept: "application/json" },
      cache: "no-store",
    });
  }

  private async refresh() {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.creds.refreshToken!,
      client_id: this.creds.clientId,
    });
    if (this.creds.clientSecret) body.set("client_secret", this.creds.clientSecret);
    const res = await this.fetchImpl(`https://${this.creds.loginHost}/services/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    if (!res.ok) throw new SalesforceAuthError();
    const json = (await res.json()) as { access_token: string; instance_url?: string };
    this.creds = {
      ...this.creds,
      accessToken: json.access_token,
      instanceUrl: json.instance_url ?? this.creds.instanceUrl,
    };
    await this.options.onTokenRefresh?.(this.creds.accessToken, this.creds.instanceUrl);
  }
}

async function toError(res: Response): Promise<SalesforceError> {
  let message = `Salesforce request failed (${res.status})`;
  let code: string | undefined;
  try {
    const body = (await res.json()) as { message?: string; errorCode?: string }[] | { error_description?: string };
    const first = Array.isArray(body) ? body[0] : undefined;
    if (first?.message) {
      message = first.message;
      code = first.errorCode;
    } else if (!Array.isArray(body) && body.error_description) {
      message = body.error_description;
    }
  } catch {
    // Non-JSON error body; keep the generic message.
  }
  return new SalesforceError(message, res.status, code);
}
