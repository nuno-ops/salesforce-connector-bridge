import "server-only";
import { eq } from "drizzle-orm";
import { decrypt, encrypt } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { SalesforceClient } from "./client";
import { revokeToken } from "./oauth";

type Connection = typeof schema.sfConnections.$inferSelect;

/** A client for a stored connection that persists refreshed tokens. */
export function clientFor(connection: Connection) {
  const e = env();
  return new SalesforceClient(
    {
      instanceUrl: connection.instanceUrl,
      loginHost: connection.loginHost,
      accessToken: decrypt(connection.accessTokenEnc),
      refreshToken: connection.refreshTokenEnc ? decrypt(connection.refreshTokenEnc) : null,
      clientId: e.SALESFORCE_CLIENT_ID,
      clientSecret: e.SALESFORCE_CLIENT_SECRET,
    },
    {
      onTokenRefresh: async (accessToken, instanceUrl) => {
        await db()
          .update(schema.sfConnections)
          .set({ accessTokenEnc: encrypt(accessToken), instanceUrl, status: "active" })
          .where(eq(schema.sfConnections.id, connection.id));
      },
    },
  );
}

export async function markExpired(connectionId: string) {
  await db().update(schema.sfConnections).set({ status: "expired" }).where(eq(schema.sfConnections.id, connectionId));
}

/** Revokes the Salesforce tokens and deletes the connection with its scans. */
export async function disconnect(connection: Connection) {
  const token = connection.refreshTokenEnc ?? connection.accessTokenEnc;
  await revokeToken(connection.loginHost, decrypt(token));
  await db().delete(schema.sfConnections).where(eq(schema.sfConnections.id, connection.id));
}
