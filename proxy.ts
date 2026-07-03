import { NextRequest, NextResponse } from "next/server";

const OPS_COOKIE = "ops_access";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const gateEnabled = process.env.OPS_GATE_ENABLED === "true";
  const expectedToken = process.env.OPS_ACCESS_TOKEN?.trim();
  const ownerEmail = process.env.OPS_OWNER_EMAIL?.trim().toLowerCase();
  const token = request.cookies.get(OPS_COOKIE)?.value || "";
  const hasValidToken = Boolean((expectedToken && token === expectedToken) || (ownerEmail && token.toLowerCase() === ownerEmail));

  const isOpsPage = pathname.startsWith("/ops");
  const isOpsApi = pathname.startsWith("/api/ops");
  const isLoginPage = pathname === "/ops/login";
  const isAuthRoute = pathname === "/api/ops/auth";
  const isLogoutRoute = pathname === "/api/ops/logout";

  if (!isOpsPage && !isOpsApi) {
    return NextResponse.next();
  }

  if (!gateEnabled) {
    return NextResponse.next();
  }

  if (isLoginPage || isAuthRoute || isLogoutRoute) {
    if (isLoginPage && hasValidToken) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/ops/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/api/ops")) {
    if (hasValidToken) {
      return NextResponse.next();
    }

    return NextResponse.json({ ok: false, error: "Unauthorized ops request." }, { status: 401 });
  }

  if (hasValidToken) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/ops/login";
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/ops/:path*", "/api/ops/:path*"],
};
