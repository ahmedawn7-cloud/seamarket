import { NextResponse } from "next/server";

type TelegramUpdate = {
  message?: {
    chat?: {
      id?: number | string;
      type?: string;
      username?: string;
      first_name?: string;
      title?: string;
    };
    from?: {
      username?: string;
      first_name?: string;
    };
    date?: number;
  };
};

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN is not configured." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20`, {
      cache: "no-store",
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      return NextResponse.json(
        { ok: false, error: payload.description || "Could not read Telegram updates." },
        { status: response.status || 500 },
      );
    }

    const chats = Array.from(
      new Map(
        (payload.result || [])
          .map((update: TelegramUpdate) => update.message?.chat)
          .filter(Boolean)
          .map((chat: NonNullable<TelegramUpdate["message"]>["chat"]) => [
            String(chat!.id),
            {
              id: String(chat!.id),
              label: chat!.title || chat!.username || chat!.first_name || String(chat!.id),
              type: chat!.type || "chat",
            },
          ]),
      ).values(),
    );

    return NextResponse.json({ ok: true, chats });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Telegram updates request failed." },
      { status: 500 },
    );
  }
}
