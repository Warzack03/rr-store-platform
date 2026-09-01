import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getPrismaClient } from "@/server/db/client";

const currentStaticPaths = new Set([
  "/",
  "/productos",
  "/carrito",
  "/aviso-legal",
  "/privacidad",
  "/cookies",
  "/condiciones-de-compra",
  "/envios",
  "/cambios-y-devoluciones",
]);
const privatePathsWithoutRedirects = ["/checkout", "/pedido/"];

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (
      request.nextUrl.pathname === "/admin/login" ||
      request.nextUrl.pathname === "/admin/2fa"
    ) {
      return NextResponse.next();
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const admin = await getPrismaClient().adminUser.findUnique({
      where: { id: session.user.id },
      select: { isActive: true, sessionVersion: true, totpEnabled: true },
    });
    if (
      !admin?.isActive ||
      !admin.totpEnabled ||
      admin.sessionVersion !== session.user.sessionVersion
    ) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (
    (request.method !== "GET" && request.method !== "HEAD") ||
    currentStaticPaths.has(request.nextUrl.pathname) ||
    privatePathsWithoutRedirects.some((prefix) => request.nextUrl.pathname.startsWith(prefix))
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
    "/((?!api|media|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|brand|.*\\.(?:jpg|jpeg|png|webp|gif|svg|ico|css|js|map|woff2?)$).*)",
  ],
};
