import { NextRequest, NextResponse } from "next/server";

// Forces the server to stay awake and dynamic (Standard Next.js practice for webhooks)
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    // Securely check against the Netlify environment variable
    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log("✅ Webhook verified successfully in Production.");

      // Meta requires plain text challenge echo
      return new Response(challenge || "", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    console.warn("❌ Webhook verification failed. Token mismatch.", { mode, token });
    return new Response("Forbidden", { status: 403 });

  } catch (error) {
    console.error("❌ Critical error during webhook verification:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return new NextResponse("OK", { status: 200 });
    }

    console.log(`[WhatsApp] Message received from ${message.from}: "${message.text?.body}"`);
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Failed to process payload", error);
    return new NextResponse("OK", { status: 200 });
  }
}