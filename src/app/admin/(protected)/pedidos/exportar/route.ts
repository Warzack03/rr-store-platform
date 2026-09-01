import { requireAdmin } from "@/features/admin/auth/session";
import { slugify } from "@/features/admin/server/shared";
import { buildManufacturingCsv } from "@/features/orders/domain";
import { getPrismaClient } from "@/server/db/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAdmin();
  const dropId = new URL(request.url).searchParams.get("dropId")?.trim();
  if (!dropId || dropId.length > 30) return new Response("Selecciona un drop válido.", { status: 400 });
  const prisma = getPrismaClient();
  const drop = await prisma.drop.findUnique({ where: { id: dropId }, select: { title: true } });
  if (!drop) return new Response("Drop no encontrado.", { status: 404 });
  const orders = await prisma.order.findMany({
    where: {
      dropId,
      status: { not: "CANCELLED" },
      payment: { is: { status: { not: "REFUNDED" } } },
    },
    orderBy: { number: "asc" },
    select: {
      number: true,
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          productNameSnapshot: true,
          sizeLabelSnapshot: true,
          quantity: true,
          customizations: {
            where: { orderItemComponentId: null },
            orderBy: { sortOrder: "asc" },
            select: { type: true, valueSnapshot: true },
          },
          components: {
            orderBy: { sortOrder: "asc" },
            select: {
              componentLabelSnapshot: true,
              productNameSnapshot: true,
              sizeLabelSnapshot: true,
              quantitySnapshot: true,
              customizations: { orderBy: { sortOrder: "asc" }, select: { type: true, valueSnapshot: true } },
            },
          },
        },
      },
    },
  });
  const csv = buildManufacturingCsv(orders);
  const filename = `fabricacion-${slugify(drop.title) || "drop"}.csv`;
  return new Response(csv, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
