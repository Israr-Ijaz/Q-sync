import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/webhooks/whatsapp
 *
 * Meta Webhook Verification Handshake.
 * When you register a webhook URL in the Meta Developer Console, Meta sends a
 * one-time GET request with three query parameters to confirm you own the endpoint.
 * We must echo back hub.challenge as plain text with a 200 status.
 *
 * Docs: https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verification handshake successful.");
    // Meta requires the challenge echoed back as plain text, not JSON.
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn(
    "[WhatsApp Webhook] Verification failed — token mismatch or wrong mode.",
    { mode, token }
  );
  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * POST /api/webhooks/whatsapp
 *
 * Receives all incoming WhatsApp events (messages, delivery receipts, read
 * receipts, status updates, etc.) from Meta's Cloud API.
 *
 * Meta expects a 200 OK within ~20 seconds; otherwise it retries the delivery.
 * We acknowledge immediately and do any heavy lifting asynchronously.
 *
 * Payload shape (simplified):
 * {
 *   entry: [{
 *     changes: [{
 *       value: {
 *         messages: [{ from: string, text: { body: string }, ... }],
 *         statuses: [...]   // delivery / read receipts — no message object
 *       }
 *     }]
 *   }]
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Safely traverse the deeply-nested Meta payload.
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // If there is no message object, this is a status/delivery receipt event.
    // Acknowledge it immediately so Meta does not retry.
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
    // Suggested implementation steps:
    //   1. Normalise messageText (trim, lowercase) and check if it === "join".
    //   2. Call Supabase to upsert the user row and generate/retrieve a unique sync token.
    //   3. Use the Meta Cloud API (POST /{phone-number-id}/messages) to send the
    //      token back to senderPhone as a WhatsApp text message.
    //   4. Handle duplicate "JOIN" requests gracefully (idempotent token lookup).

    // Acknowledge successful receipt. Meta requires this to stop retrying.
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    // Log the error but still return 200 so Meta does not endlessly retry a
    // payload our server cannot parse. Investigate the error separately.
    console.error(
      "[WhatsApp Webhook] Failed to process incoming payload:",
      error
    );
    return new NextResponse("OK", { status: 200 });
  }
}
