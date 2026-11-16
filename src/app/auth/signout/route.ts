import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", requestOrigin(request)), { status: 303 });
}
