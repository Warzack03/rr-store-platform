import "server-only";

import {
  calculateDiscount,
  couponEligibilityError,
  emptyCart,
  isValidDorsal,
  normalizeCouponCode,
  normalizeName,
  type CartCustomizationSelection,
  type CartLine,
  type StoredCart,
} from "@/features/cart/domain";
import type { ValidatedCart, ValidatedCartLine } from "@/features/cart/validation-types";
import { getPrismaClient } from "@/server/db/client";

function mediaUrl(storageKey: string) {
  return `/media/${storageKey.split("/").map(encodeURIComponent).join("/")}`;
}

type Customization = {
  id: string;
  type: "NAME" | "NUMBER";
  label: string;
  maxLength: number | null;
  minNumber: number | null;
  maxNumber: number | null;
  isActive: boolean;
};

function validateCustomizations(
  selections: CartCustomizationSelection[],
  available: Customization[],
  surchargeByKey: Map<string, number>,
  componentId: string | null,
) {
  const sanitized: CartCustomizationSelection[] = [];
  const labels: string[] = [];
  let surchargeCents = 0;
  const seen = new Set<string>();

  for (const selection of selections) {
    if (seen.has(selection.customizationId)) return null;
    seen.add(selection.customizationId);
    const customization = available.find(
      (candidate) => candidate.id === selection.customizationId && candidate.isActive,
    );
    const surcharge = surchargeByKey.get(
      `${selection.customizationId}:${componentId ?? "product"}`,
    );
    if (!customization || surcharge === undefined) return null;

    let value: string;
    if (customization.type === "NAME") {
      value = normalizeName(selection.value);
      if (!value || value.length > (customization.maxLength ?? 12)) return null;
    } else {
      value = selection.value.trim();
      if (
        !isValidDorsal(
          value,
          customization.minNumber ?? 0,
          customization.maxNumber ?? 99,
        )
      ) return null;
    }
    sanitized.push({ customizationId: customization.id, value });
    labels.push(`${customization.label}: ${value}`);
    surchargeCents += surcharge;
  }
  return { sanitized, labels, surchargeCents };
}

const emptyValidatedCart = (issues: string[] = []): ValidatedCart => ({
  cart: emptyCart(),
  dropId: null,
  dropTitle: null,
  dropEndsAt: null,
  lines: [],
  subtotalCents: 0,
  discountCents: 0,
  totalCents: 0,
  coupon: null,
  couponError: null,
  issues,
});

export async function validateCart(input: StoredCart): Promise<ValidatedCart> {
  if (input.lines.length === 0) return emptyValidatedCart();
  const issues: string[] = [];
  const dropId = input.lines[0].dropId;
  if (input.lines.some((line) => line.dropId !== dropId)) {
    return emptyValidatedCart([
      "El carrito contenía productos de drops distintos y se ha vaciado por seguridad.",
    ]);
  }

  const prisma = getPrismaClient();
  const now = new Date();
  const drop = await prisma.drop.findFirst({
    where: {
      id: dropId,
      status: "PUBLISHED",
      archivedAt: null,
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    select: { id: true, title: true, endsAt: true },
  });
  if (!drop?.endsAt) {
    return emptyValidatedCart([
      "El drop del carrito ya no está disponible. Hemos retirado sus productos.",
    ]);
  }

  const records = await prisma.dropProduct.findMany({
    where: {
      id: { in: [...new Set(input.lines.map((line) => line.dropProductId))] },
      dropId: drop.id,
      isVisible: true,
      product: { status: "PUBLISHED", archivedAt: null },
    },
    include: {
      marketingMedia: true,
      customizationPrices: { where: { isEnabled: true } },
      product: {
        include: {
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            include: { mediaAsset: true },
          },
          sizes: { include: { size: true } },
          customizations: true,
          bundleComponents: {
            orderBy: { sortOrder: "asc" },
            include: {
              componentProduct: {
                include: {
                  sizes: { include: { size: true } },
                  customizations: true,
                },
              },
            },
          },
        },
      },
    },
  });
  const byId = new Map(records.map((record) => [record.id, record]));
  const sanitizedLines: CartLine[] = [];
  const validatedLines: ValidatedCartLine[] = [];

  for (const line of input.lines) {
    const record = byId.get(line.dropProductId);
    if (!record || record.productId !== line.productId) {
      issues.push("Un producto ya no está disponible y se ha retirado del carrito.");
      continue;
    }
    const surchargeByKey = new Map(
      record.customizationPrices.map((config) => [
        `${config.productCustomizationId}:${config.bundleComponentId ?? "product"}`,
        config.surchargeCents,
      ]),
    );
    let sanitizedSizeId: string | null = null;
    let sanitizedCustomizations: CartCustomizationSelection[] = [];
    const sanitizedComponents: CartLine["components"] = [];
    const selections: string[] = [];
    let customizationCents = 0;
    let valid = true;

    if (record.product.type === "SIMPLE") {
      const size = record.product.sizes.find(
        (candidate) => candidate.sizeId === line.sizeId,
      );
      if (!size || line.components.length > 0) valid = false;
      else {
        sanitizedSizeId = size.sizeId;
        selections.push(`Talla: ${size.size.label}`);
        const custom = validateCustomizations(
          line.customizations,
          record.product.customizations,
          surchargeByKey,
          null,
        );
        if (!custom) valid = false;
        else {
          sanitizedCustomizations = custom.sanitized;
          selections.push(...custom.labels);
          customizationCents += custom.surchargeCents;
        }
      }
    } else {
      if (
        line.sizeId !== null ||
        line.customizations.length > 0 ||
        line.components.length !== record.product.bundleComponents.length
      ) valid = false;
      for (const component of record.product.bundleComponents) {
        const selection = line.components.find(
          (candidate) => candidate.bundleComponentId === component.id,
        );
        const size = selection
          ? component.componentProduct.sizes.find(
              (candidate) => candidate.sizeId === selection.sizeId,
            )
          : null;
        if (!selection || !size) { valid = false; break; }
        const custom = validateCustomizations(
          selection.customizations,
          component.componentProduct.customizations,
          surchargeByKey,
          component.id,
        );
        if (!custom) { valid = false; break; }
        sanitizedComponents.push({
          bundleComponentId: component.id,
          sizeId: size.sizeId,
          customizations: custom.sanitized,
        });
        selections.push(
          `${component.label} · ${component.componentProduct.name} · Talla ${size.size.label}`,
          ...custom.labels.map((label) => `${component.label} · ${label}`),
        );
        customizationCents += custom.surchargeCents;
      }
    }

    if (!valid) {
      issues.push(
        `${record.product.name} tenía una configuración no válida y se ha retirado.`,
      );
      continue;
    }
    const sanitizedLine: CartLine = {
      ...line,
      quantity: Math.min(20, Math.max(1, line.quantity)),
      sizeId: sanitizedSizeId,
      customizations: sanitizedCustomizations,
      components: sanitizedComponents,
    };
    const primary = record.marketingMedia ?? record.product.images[0]?.mediaAsset;
    const unitTotalCents = record.priceCents + customizationCents;
    sanitizedLines.push(sanitizedLine);
    validatedLines.push({
      id: line.id,
      productId: record.product.id,
      slug: record.product.slug,
      name: record.product.name,
      quantity: sanitizedLine.quantity,
      image: primary
        ? { url: mediaUrl(primary.storageKey), altText: record.product.name }
        : null,
      selections,
      unitBasePriceCents: record.priceCents,
      unitCustomizationCents: customizationCents,
      unitTotalCents,
      lineTotalCents: unitTotalCents * sanitizedLine.quantity,
    });
  }

  const subtotalCents = validatedLines.reduce(
    (total, line) => total + line.lineTotalCents,
    0,
  );
  let coupon: ValidatedCart["coupon"] = null;
  let couponError: string | null = null;
  let discountCents = 0;
  const couponCode = input.couponCode
    ? normalizeCouponCode(input.couponCode)
    : null;
  if (couponCode && subtotalCents > 0) {
    const couponRecord = await prisma.coupon.findUnique({
      where: { code: couponCode },
      include: { _count: { select: { redemptions: true } } },
    });
    if (!couponRecord) {
      couponError = "El cupón no existe.";
    } else {
      couponError = couponEligibilityError(
        { ...couponRecord, redemptionCount: couponRecord._count.redemptions },
        { dropId: drop.id, subtotalCents, now },
      );
      if (!couponError) {
        discountCents = calculateDiscount(subtotalCents, couponRecord);
        coupon = {
          code: couponRecord.code,
          description:
            couponRecord.type === "PERCENT"
              ? `${couponRecord.value}% de descuento`
              : `${(couponRecord.value / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })} de descuento`,
        };
      }
    }
  }

  return {
    cart: { version: 1, lines: sanitizedLines, couponCode },
    dropId: drop.id,
    dropTitle: drop.title,
    dropEndsAt: drop.endsAt.toISOString(),
    lines: validatedLines,
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
    coupon,
    couponError,
    issues,
  };
}
