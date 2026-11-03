import { NextResponse, type NextRequest } from "next/server";

// STEP 25: /dev is hidden in the exhibition. Open it once with ?dev=1 (sets a session cookie); otherwise 404.
const COOKIE = "pure-dev";

export function middleware(req: NextRequest) {
  // The public deploy has no auth: dev APIs (DB dump, reset, raw LLM) stay local-only.
  if (req.nextUrl.pathname.startsWith("/api/dev")) {
    return process.env.VERCEL ? NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 }) : NextResponse.next();
  }
  if (req.nextUrl.searchParams.get("dev") === "1") {
    const res = NextResponse.next();
    res.cookies.set(COOKIE, "1", { path: "/", sameSite: "lax" });
    return res;
  }
  if (req.cookies.get(COOKIE)?.value === "1") return NextResponse.next();
  return NextResponse.rewrite(new URL("/_dev-hidden", req.url));
}

export const config = { matcher: ["/dev", "/dev/:path*", "/api/dev/:path*"] };
