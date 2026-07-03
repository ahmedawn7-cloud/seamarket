import { NextResponse } from "next/server";

const OPS_COOKIE = "ops_access";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: OPS_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
