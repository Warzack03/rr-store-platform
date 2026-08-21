import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getPrismaClient } from "@/server/db/client";

const currentStaticPaths = new Set(["/", "/productos", "/carrito"]);

export async function proxy(request: NextRequest) {
  if (
    (request.method !== "GET" && request.method !== "HEAD") ||
    currentStaticPaths.has(request.nextUrl.pathname)
  ) {
    return NextResponse.next();
  }

  try {
    const redirect = await getPrismaClient().redirect.findUnique({
      where: { fromPath: request.nextUrl.pathname },
      select: { toPath: true, statusCode: true },
    });

    if (
      !redirect ||
      redirect.statusCode !== 301 ||
      !redirect.toPath.startsWith("/") ||
      redirect.toPath.startsWith("//") ||
      redirect.toPath === request.nextUrl.pathname
    ) {
      return NextResponse.next();
    }

    const destination = new URL(redirect.toPath, request.url);
    return NextResponse.redirect(destination, 301);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!api|admin|media|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|brand|.*\\.(?:jpg|jpeg|png|webp|gif|svg|ico|css|js|map|woff2?)$).*)",
  ],
};
