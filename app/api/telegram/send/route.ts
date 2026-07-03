import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN is not configured." },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const chatId = String(body.chatId || "").trim();
    const text = String(body.text || "Profit Pilot AI alert test.").trim();

    if (!chatId) {
      return NextResponse.json({ ok: false, error: "Telegram chat ID is required." }, { status: 400 });
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      return NextResponse.json(
        { ok: false, error: payload.description || "Telegram message failed." },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Telegram request failed." },
      { status: 500 },
    );
  }
}
