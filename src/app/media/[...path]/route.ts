import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/env";
import { getPrismaClient } from "@/server/db/client";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!env.MEDIA_ROOT) {
    return new Response(null, { status: 404 });
  }

  const { path: segments } = await context.params;
  if (
    segments.length === 0 ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return new Response(null, { status: 404 });
  }

  const storageKey = segments.join("/");
  const media = await getPrismaClient().mediaAsset.findUnique({
    where: { storageKey },
    select: { mimeType: true },
  });

  if (!media || !allowedImageTypes.has(media.mimeType)) {
    return new Response(null, { status: 404 });
  }

  try {
    const mediaRoot = await realpath(path.resolve(env.MEDIA_ROOT));
    const mediaPath = await realpath(path.resolve(mediaRoot, ...segments));
    const relativePath = path.relative(mediaRoot, mediaPath);

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      return new Response(null, { status: 404 });
    }

    const contents = await readFile(mediaPath);
    return new Response(contents, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(contents.byteLength),
        "Content-Type": media.mimeType,
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
