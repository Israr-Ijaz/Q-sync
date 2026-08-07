import { NextRequest, NextResponse } from "next/server";

// CRITICAL FIX: This forces Next.js to treat this as a live, dynamic API route instead of caching it.
export const dynamic = "force-dynamic";

/**
 * GET /api/webhooks/whatsapp
 * Meta Webhook Verification Handshake.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verification handshake successful.");

    // CRITICAL FIX: Using standard Response instead of NextResponse removes all hidden Next.js formatting
    // Forcing 'text/plain' ensures Meta bots accept the string
    return new Response(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn(
    "[WhatsApp Webhook] Verification failed — token mismatch or wrong mode.",
    { mode, token }
  );
  return new Response("Forbidden", { status: 403 });
}

/**
 * POST /api/webhooks/whatsapp
 * Receives all incoming WhatsApp events.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      console.log(
        "[WhatsApp Webhook] Received a non-message event (status/receipt). Acknowledged."
      );
      return new NextResponse("OK", { status: 200 });
    }

    const senderPhone: string = message.from;
    const messageText: string | undefined = message.text?.body;

    console.log(
      `[WhatsApp Webhook] Message received from ${senderPhone}: "${messageText}"`
    );

    // TODO: QSync Phase 1.1 - Parse "JOIN" command, generate Token via Supabase, and fire Meta API reply.

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error(
      "[WhatsApp Webhook] Failed to process incoming payload:",
      error
    );
    return new NextResponse("OK", { status: 200 });
  }
}