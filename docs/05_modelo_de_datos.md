# Documento 5 — Modelo de datos MySQL/Prisma

## 1. Principios

- MySQL/MariaDB + Prisma.
- IDs internos no se usan como control de acceso público.
- Importes en céntimos enteros.
- Interfaz en `Europe/Madrid`.
- Snapshots históricos en pedidos.
- No borrar transacciones desde backoffice.
- Archivar catálogo.
- Sin inventario, Customer, Invoice, TaxRate ni ImportBatch en el MVP.

## 2. Enums recomendados

`ProductType`: `SIMPLE`, `BUNDLE`.

`ProductStatus`: `DRAFT`, `PUBLISHED`, `ARCHIVED`.

`DropStatus`: `DRAFT`, `PUBLISHED`, `ARCHIVED`.

`CustomizationType`: `NAME`, `NUMBER`.

`CouponType`: `PERCENT`, `FIXED`.

`CheckoutAttemptStatus`: `CREATED`, `REDIRECTED`, `PAID`, `EXPIRED`, `CANCELLED`, `FAILED`.

`OrderStatus`: `RECEIVED`, `IN_PRODUCTION`, `SHIPPED`, `DELIVERED`, `CANCELLED`.

`PaymentStatus`: `PAID`, `PARTIALLY_REFUNDED`, `REFUNDED`.

`ShippingKind`: `HOME` para todo pedido del MVP. Si el esquema conserva temporalmente `PICKUP` por una migración anterior, queda reservado y no debe utilizarse en UI, checkout ni nuevos pedidos.

`EmailDeliveryStatus`: `PENDING`, `SENT`, `FAILED`.

## 3. `AdminUser`

Campos: `id`, `email` unique, `passwordHash`, `totpSecretEncrypted`, `totpEnabled`, `isActive`, mecanismo de revocación de sesión, `createdAt`, `updatedAt`, `lastLoginAt`.

Reglas: sin registro público, Argon2id, TOTP cifrado.

## 4. `AdminRecoveryCode`

`id`, `adminUserId`, `codeHash`, `usedAt`, `createdAt`. Nunca código en claro.

## 5. `Drop`

`id`, `title`, `slug` opcional para anchors, `shortText`, `startsAt`, `endsAt`, `status`, `isPrimary`, `heroMediaId`, `heroAlt`, timestamps y `archivedAt`.

Restricciones: `endsAt > startsAt`; publicado requiere fechas válidas.

Índice: `(status, startsAt, endsAt)`.

## 6. `Product`

`id`, `type`, `status`, `name`, `slug` unique, `shortDescription`, `description`, `seoTitle`, `seoDescription`, `sizeGuideId`, timestamps y `archivedAt`.

No tiene precio global.

## 7. `Redirect`

`id`, `fromPath` unique, `toPath`, `statusCode=301`, `createdAt`.

## 8. `Size`

`id`, `label`, `sortOrder`, `isActive`, timestamps.

## 9. `ProductSize`

`productId`, `sizeId`, `sortOrder` opcional, `createdAt`.

Unique `(productId, sizeId)`.

## 10. `SizeGuide`

`id`, `name`, `mediaAssetId`, `altText`, timestamps.

## 11. `MediaAsset`

`id`, `storageKey` unique, `originalName`, `mimeType`, `byteSize`, `width`, `height`, `altText` opcional, `createdAt`.

`storageKey` siempre relativo, por ejemplo `products/2026/camiseta-front-abc123.webp`.

## 12. `ProductImage`

`id`, `productId`, `mediaAssetId`, `sortOrder`, `isPrimary`, `altText`, `createdAt`.

Funcionalmente una principal por producto.

## 13. `ProductCustomization`

`id`, `productId`, `type`, `label`, `maxLength`, `minNumber`, `maxNumber`, `sortOrder`, `isActive`.

Camiseta: NAME y NUMBER. Pantalón: NUMBER.

## 14. `BundleComponent`

`id`, `bundleProductId`, `componentProductId`, `role`, `quantity`, `sortOrder`.

Equipación: roles `SHIRT` y `SHORTS` o equivalentes.

## 15. `DropProduct`

`id`, `dropId`, `productId`, `priceCents`, `compareAtPriceCents`, `isVisible`, `sortOrder`, `marketingMediaId`, timestamps.

Unique `(dropId, productId)`.

Antes del drop, la capa pública no expone precio.

## 16. `DropProductCustomization`

`id`, `dropProductId`, `productCustomizationId`, `bundleComponentId` nullable, `isEnabled`, `surchargeCents`, timestamps.

Permite suplemento distinto por drop y componente.

## 17. `Coupon`

`id`, `code` unique, `type`, `value`, `dropId` nullable, `minOrderCents`, `maxRedemptions`, `startsAt`, `endsAt`, `isActive`, timestamps, `archivedAt`.

Normalizar código a mayúsculas.

## 18. `CheckoutAttempt`

Entidad temporal previa al pedido.

Campos: `id` UUID/CUID, `dropId`, `status`, contacto, `notes`, `currency=EUR`, subtotales, descuento, envío, total, `couponId`, `shippingKind`, `shippingSnapshot` JSON, `cartSnapshot` JSON, `stripeCheckoutSessionId` unique, `stripePaymentIntentId` unique nullable, `expiresAt`, timestamps y `paidAt`.

El JSON solo contiene snapshot temporal validado por servidor.

## 19. `Order`

`id`, `number` unique, `publicToken` unique, `dropId`, `status`, `email`, `firstName`, `lastName`, `phone`, `notes`, `currency`, `subtotalCents`, `discountCents`, `shippingCents`, `totalCents`, snapshot de cupón, timestamps, `cancelledAt`, `deliveredAt`.

Índices: `number`, `publicToken`, `(status, createdAt)`, `email`, `(dropId, createdAt)`.

La asignación de número debe ser transaccional.

## 20. `OrderItem`

`id`, `orderId`, referencias fuente opcionales, `productTypeSnapshot`, `productNameSnapshot`, `productSlugSnapshot`, `unitBasePriceCents`, `unitCustomizationCents`, `unitTotalCents`, `quantity`, `lineTotalCents`, `createdAt`.

## 21. `OrderItemComponent`

`id`, `orderItemId`, `role`, `productNameSnapshot`, `sizeLabelSnapshot`, `sortOrder`.

Especialmente para bundles.

## 22. `OrderItemCustomization`

`id`, `orderItemId`, `orderItemComponentId` nullable, `type`, `labelSnapshot`, `valueSnapshot`, `surchargeCentsSnapshot`, `sortOrder`.

## 23. `OrderAddress`

Solo domicilio: `id`, `orderId` unique, `countryCode=ES`, `postalCode`, `province`, `city`, `street`, `streetNumber`, `additionalLine`, `createdAt`.

## 24. `Shipment`

`id`, `orderId` unique, `kind=HOME`, `carrier=SEUR`, `trackingNumber`, `trackingUrl`, `shippedAt`, timestamps.

## 25. `ShippingMethod`

`id`, `kind` unique, `displayName`, `priceCents`, `isEnabled`, `sortOrder`, timestamps.

Valor inicial: HOME=499. Nunca hardcodear en lógica comercial.

## 26. `Payment`

`id`, `orderId` unique, `provider=STRIPE`, `stripeCheckoutSessionId` unique, `stripePaymentIntentId` unique nullable, `status`, `amountCents`, `currency`, `paidAt`, timestamps.

No PAN/CVC.

## 27. `Refund`

`id`, `paymentId`, `stripeRefundId` unique, `amountCents`, `status`, `reason` nullable, timestamps. Permite múltiples parciales.

## 28. `StripeEvent`

`id`, `stripeEventId` unique, `type`, `receivedAt`, `processedAt`, `processingStatus`, `errorSummary` nullable.

Clave de idempotencia: `stripeEventId` unique.

## 29. `CouponRedemption`

`id`, `couponId`, `orderId` unique, `discountCents`, `createdAt`.

Solo sobre pedidos pagados.

## 30. `OrderStatusHistory`

`id`, `orderId`, `fromStatus`, `toStatus`, `changedByAdminUserId` nullable, `source`, `createdAt`.

## 31. `EmailDelivery`

`id`, `orderId` nullable, `type`, `recipient`, `status`, `attemptCount`, `lastAttemptAt`, `sentAt`, `lastErrorSummary`, timestamps.

## 32. `AuditLog`

`id`, `adminUserId`, `action`, `entityType`, `entityId`, `changeSummary` JSON nullable, `createdAt`.

No incluir contraseñas, hashes, secretos, TOTP o PII innecesaria.

## 33. `StoreSettings`

Fila única: `id`, `storeName`, `supportEmail`, `deliveryEstimateText`, `globalNotice`, `globalNoticeEnabled`, timestamps.

Sin secretos.

## 34. Borrado

Nunca borrar desde backoffice: Order, OrderItem, Payment, Refund, Shipment, CouponRedemption, OrderStatusHistory y AuditLog.

Archivar: Product, Drop, Coupon.

Limpieza técnica posterior posible: CheckoutAttempt expirados y media sin referencias.

## 35. Integridad e índices clave

- `DropProduct(dropId, productId)` unique.
- `ProductSize(productId, sizeId)` unique.
- `StripeEvent.stripeEventId` unique.
- `Payment.stripeCheckoutSessionId` unique.
- `Order.publicToken` unique.
- `Order.number` unique.
- `Redirect.fromPath` unique.
- `Coupon.code` unique.
- `Shipment.orderId` unique en el MVP.

## 36. Idempotencia del pago

En transacción:

1. verificar evento no procesado;
2. obtener/bloquear CheckoutAttempt;
3. comprobar que no existe Order/Payment previo;
4. crear Order;
5. crear items y snapshots;
6. crear Payment;
7. crear Shipment;
8. crear CouponRedemption;
9. registrar estado inicial;
10. marcar intento pagado;
11. marcar evento procesado.

El email se dispara después del commit.

## 37. Entidades descartadas

No implementar `Customer`, `CustomerAddress`, `Inventory`, `InventoryMovement`, `TaxRate`, `Invoice`, `ImportBatch` ni `ImportBatchItem`.
