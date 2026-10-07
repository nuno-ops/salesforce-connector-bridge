import { NextResponse, type NextRequest } from "next/server";
import { handleWebhook } from "@/lib/billing/server";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  const payload = await request.text();
  try {
    const applied = await handleWebhook(payload, signature);
    return NextResponse.json({ received: true, duplicate: !applied });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook failed";
    const isSignature = /signature/i.test(message);
    console.error("stripe webhook", message);
    return NextResponse.json({ error: isSignature ? "Invalid signature" : "Webhook failed" }, { status: isSignature ? 400 : 500 });
  }
}
