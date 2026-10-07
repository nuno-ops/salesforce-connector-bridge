import { afterEach, describe, expect, it } from "vitest";
import { supabaseConfig } from "./config";

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
];

afterEach(() => {
  for (const k of KEYS) delete process.env[k];
});

describe("supabaseConfig", () => {
  it("returns null when nothing is set", () => {
    for (const k of KEYS) delete process.env[k];
    expect(supabaseConfig()).toBeNull();
  });

  it("prefers the documented names", () => {
    Object.assign(process.env, {
      NEXT_PUBLIC_SUPABASE_URL: "https://a.supabase.co",
      SUPABASE_URL: "https://b.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pub",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    });
    expect(supabaseConfig()).toEqual({ url: "https://a.supabase.co", key: "pub" });
  });

  it("falls back to the anon key and server-side names", () => {
    Object.assign(process.env, { SUPABASE_URL: "https://b.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon" });
    expect(supabaseConfig()).toEqual({ url: "https://b.supabase.co", key: "anon" });
  });
});
