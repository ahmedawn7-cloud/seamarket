import { NextResponse } from "next/server";

const OPS_COOKIE = "ops_access";

export async function POST(request: Request) {
  try {
    const expectedToken = process.env.OPS_ACCESS_TOKEN?.trim();
    const ownerEmail = process.env.OPS_OWNER_EMAIL?.trim().toLowerCase();

    if (!expectedToken && !ownerEmail) {
      return NextResponse.json(
        { ok: false, error: "OPS_ACCESS_TOKEN or OPS_OWNER_EMAIL is not configured." },
        { status: 500 },
      );
    }

    const body = (await request.json().catch(() => null)) as { token?: string; next?: string } | null;
    const token = body?.token?.trim() || "";
    const normalizedToken = token.toLowerCase();
    const nextPath = sanitizeNextPath(body?.next);

    if (!token) {
      return NextResponse.json({ ok: false, error: "Token is required." }, { status: 400 });
    }

    const isValidToken = Boolean(expectedToken && token === expectedToken);
    const isOwnerEmail = Boolean(ownerEmail && normalizedToken === ownerEmail);

    if (!isValidToken && !isOwnerEmail) {
      return NextResponse.json({ ok: false, error: "Invalid ops token or owner email." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, next: nextPath });
    response.cookies.set({
      name: OPS_COOKIE,
      value: expectedToken || ownerEmail || token,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Ops authentication failed." },
      { status: 500 },
    );
  }
}

function sanitizeNextPath(value: unknown) {
  if (typeof value !== "string") return "/ops/dashboard";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/ops")) return "/ops/dashboard";
  return trimmed;
}
