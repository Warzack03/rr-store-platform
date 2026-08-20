-- CreateTable
CREATE TABLE `AdminUser` (
    `id` VARCHAR(30) NOT NULL,
    `email` VARCHAR(320) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `totpSecretEncrypted` TEXT NULL,
    `totpEnabled` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sessionVersion` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastLoginAt` DATETIME(3) NULL,

    UNIQUE INDEX `AdminUser_email_key`(`email`),
    INDEX `AdminUser_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminRecoveryCode` (
    `id` VARCHAR(30) NOT NULL,
    `adminUserId` VARCHAR(30) NOT NULL,
    `codeHash` VARCHAR(255) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AdminRecoveryCode_adminUserId_usedAt_idx`(`adminUserId`, `usedAt`),
    UNIQUE INDEX `AdminRecoveryCode_adminUserId_codeHash_key`(`adminUserId`, `codeHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Drop` (
    `id` VARCHAR(30) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NULL,
    `shortText` TEXT NOT NULL,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `heroMediaId` VARCHAR(30) NULL,
    `heroAlt` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `archivedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Drop_slug_key`(`slug`),
    INDEX `Drop_status_startsAt_endsAt_idx`(`status`, `startsAt`, `endsAt`),
    INDEX `Drop_isPrimary_status_idx`(`isPrimary`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(30) NOT NULL,
    `type` ENUM('SIMPLE', 'BUNDLE') NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `shortDescription` VARCHAR(500) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `seoTitle` VARCHAR(191) NULL,
    `seoDescription` VARCHAR(500) NULL,
    `sizeGuideId` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `archivedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Product_slug_key`(`slug`),
    INDEX `Product_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `Product_sizeGuideId_idx`(`sizeGuideId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Redirect` (
    `id` VARCHAR(30) NOT NULL,
    `fromPath` VARCHAR(500) NOT NULL,
    `toPath` VARCHAR(500) NOT NULL,
    `statusCode` SMALLINT UNSIGNED NOT NULL DEFAULT 301,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Redirect_fromPath_key`(`fromPath`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Size` (
    `id` VARCHAR(30) NOT NULL,
    `label` VARCHAR(50) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Size_label_key`(`label`),
    INDEX `Size_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductSize` (
    `productId` VARCHAR(30) NOT NULL,
    `sizeId` VARCHAR(30) NOT NULL,
    `sortOrder` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProductSize_sizeId_idx`(`sizeId`),
    PRIMARY KEY (`productId`, `sizeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SizeGuide` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `mediaAssetId` VARCHAR(30) NOT NULL,
    `altText` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SizeGuide_mediaAssetId_idx`(`mediaAssetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MediaAsset` (
    `id` VARCHAR(30) NOT NULL,
    `storageKey` VARCHAR(500) NOT NULL,
    `originalName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `byteSize` BIGINT UNSIGNED NOT NULL,
    `width` INTEGER UNSIGNED NOT NULL,
    `height` INTEGER UNSIGNED NOT NULL,
    `altText` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MediaAsset_storageKey_key`(`storageKey`),
    INDEX `MediaAsset_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductImage` (
    `id` VARCHAR(30) NOT NULL,
    `productId` VARCHAR(30) NOT NULL,
    `mediaAssetId` VARCHAR(30) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `altText` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProductImage_productId_sortOrder_idx`(`productId`, `sortOrder`),
    INDEX `ProductImage_mediaAssetId_idx`(`mediaAssetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductCustomization` (
    `id` VARCHAR(30) NOT NULL,
    `productId` VARCHAR(30) NOT NULL,
    `type` ENUM('NAME', 'NUMBER') NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `maxLength` SMALLINT UNSIGNED NULL,
    `minNumber` SMALLINT UNSIGNED NULL,
    `maxNumber` SMALLINT UNSIGNED NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `ProductCustomization_productId_isActive_sortOrder_idx`(`productId`, `isActive`, `sortOrder`),
    UNIQUE INDEX `ProductCustomization_productId_type_key`(`productId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BundleComponent` (
    `id` VARCHAR(30) NOT NULL,
    `bundleProductId` VARCHAR(30) NOT NULL,
    `componentProductId` VARCHAR(30) NOT NULL,
    `role` ENUM('SHIRT', 'SHORTS') NOT NULL,
    `quantity` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `BundleComponent_componentProductId_idx`(`componentProductId`),
    UNIQUE INDEX `BundleComponent_bundleProductId_role_key`(`bundleProductId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DropProduct` (
    `id` VARCHAR(30) NOT NULL,
    `dropId` VARCHAR(30) NOT NULL,
    `productId` VARCHAR(30) NOT NULL,
    `priceCents` INTEGER UNSIGNED NOT NULL,
    `compareAtPriceCents` INTEGER UNSIGNED NULL,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `marketingMediaId` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DropProduct_dropId_isVisible_sortOrder_idx`(`dropId`, `isVisible`, `sortOrder`),
    INDEX `DropProduct_productId_idx`(`productId`),
    INDEX `DropProduct_marketingMediaId_idx`(`marketingMediaId`),
    UNIQUE INDEX `DropProduct_dropId_productId_key`(`dropId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DropProductCustomization` (
    `id` VARCHAR(30) NOT NULL,
    `dropProductId` VARCHAR(30) NOT NULL,
    `productCustomizationId` VARCHAR(30) NOT NULL,
    `bundleComponentId` VARCHAR(30) NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `surchargeCents` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DropProductCustomization_productCustomizationId_idx`(`productCustomizationId`),
    INDEX `DropProductCustomization_bundleComponentId_idx`(`bundleComponentId`),
    UNIQUE INDEX `DropProductCustomization_dropProductId_productCustomizationI_key`(`dropProductId`, `productCustomizationId`, `bundleComponentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Coupon` (
    `id` VARCHAR(30) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `type` ENUM('PERCENT', 'FIXED') NOT NULL,
    `value` INTEGER UNSIGNED NOT NULL,
    `dropId` VARCHAR(30) NULL,
    `minOrderCents` INTEGER UNSIGNED NULL,
    `maxRedemptions` INTEGER UNSIGNED NULL,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `archivedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Coupon_code_key`(`code`),
    INDEX `Coupon_dropId_isActive_idx`(`dropId`, `isActive`),
    INDEX `Coupon_isActive_startsAt_endsAt_idx`(`isActive`, `startsAt`, `endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CheckoutAttempt` (
    `id` VARCHAR(30) NOT NULL,
    `dropId` VARCHAR(30) NOT NULL,
    `status` ENUM('CREATED', 'REDIRECTED', 'PAID', 'EXPIRED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'CREATED',
    `email` VARCHAR(320) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `notes` TEXT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'EUR',
    `subtotalCents` INTEGER UNSIGNED NOT NULL,
    `discountCents` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `shippingCents` INTEGER UNSIGNED NOT NULL,
    `totalCents` INTEGER UNSIGNED NOT NULL,
    `couponId` VARCHAR(30) NULL,
    `shippingKind` ENUM('HOME', 'PICKUP') NOT NULL,
    `shippingSnapshot` JSON NOT NULL,
    `cartSnapshot` JSON NOT NULL,
    `stripeCheckoutSessionId` VARCHAR(255) NULL,
    `stripePaymentIntentId` VARCHAR(255) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `paidAt` DATETIME(3) NULL,

    UNIQUE INDEX `CheckoutAttempt_stripeCheckoutSessionId_key`(`stripeCheckoutSessionId`),
    UNIQUE INDEX `CheckoutAttempt_stripePaymentIntentId_key`(`stripePaymentIntentId`),
    INDEX `CheckoutAttempt_status_expiresAt_idx`(`status`, `expiresAt`),
    INDEX `CheckoutAttempt_dropId_createdAt_idx`(`dropId`, `createdAt`),
    INDEX `CheckoutAttempt_couponId_idx`(`couponId`),
    INDEX `CheckoutAttempt_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(30) NOT NULL,
    `number` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `publicToken` VARCHAR(128) NOT NULL,
    `checkoutAttemptId` VARCHAR(30) NULL,
    `dropId` VARCHAR(30) NOT NULL,
    `status` ENUM('RECEIVED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'RECEIVED',
    `email` VARCHAR(320) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `notes` TEXT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'EUR',
    `subtotalCents` INTEGER UNSIGNED NOT NULL,
    `discountCents` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `shippingCents` INTEGER UNSIGNED NOT NULL,
    `totalCents` INTEGER UNSIGNED NOT NULL,
    `couponCodeSnapshot` VARCHAR(100) NULL,
    `couponTypeSnapshot` ENUM('PERCENT', 'FIXED') NULL,
    `couponValueSnapshot` INTEGER UNSIGNED NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,

    UNIQUE INDEX `Order_number_key`(`number`),
    UNIQUE INDEX `Order_publicToken_key`(`publicToken`),
    UNIQUE INDEX `Order_checkoutAttemptId_key`(`checkoutAttemptId`),
    INDEX `Order_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `Order_email_idx`(`email`),
    INDEX `Order_dropId_createdAt_idx`(`dropId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` VARCHAR(30) NOT NULL,
    `orderId` VARCHAR(30) NOT NULL,
    `productId` VARCHAR(30) NULL,
    `dropProductId` VARCHAR(30) NULL,
    `productTypeSnapshot` ENUM('SIMPLE', 'BUNDLE') NOT NULL,
    `productNameSnapshot` VARCHAR(191) NOT NULL,
    `productSlugSnapshot` VARCHAR(191) NOT NULL,
    `unitBasePriceCents` INTEGER UNSIGNED NOT NULL,
    `unitCustomizationCents` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `unitTotalCents` INTEGER UNSIGNED NOT NULL,
    `quantity` SMALLINT UNSIGNED NOT NULL,
    `lineTotalCents` INTEGER UNSIGNED NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderItem_orderId_idx`(`orderId`),
    INDEX `OrderItem_productId_idx`(`productId`),
    INDEX `OrderItem_dropProductId_idx`(`dropProductId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItemComponent` (
    `id` VARCHAR(30) NOT NULL,
    `orderItemId` VARCHAR(30) NOT NULL,
    `role` ENUM('SHIRT', 'SHORTS') NOT NULL,
    `productNameSnapshot` VARCHAR(191) NOT NULL,
    `sizeLabelSnapshot` VARCHAR(50) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `OrderItemComponent_orderItemId_sortOrder_idx`(`orderItemId`, `sortOrder`),
    UNIQUE INDEX `OrderItemComponent_orderItemId_role_key`(`orderItemId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItemCustomization` (
    `id` VARCHAR(30) NOT NULL,
    `orderItemId` VARCHAR(30) NOT NULL,
    `orderItemComponentId` VARCHAR(30) NULL,
    `type` ENUM('NAME', 'NUMBER') NOT NULL,
    `labelSnapshot` VARCHAR(100) NOT NULL,
    `valueSnapshot` VARCHAR(100) NOT NULL,
    `surchargeCentsSnapshot` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `OrderItemCustomization_orderItemId_sortOrder_idx`(`orderItemId`, `sortOrder`),
    INDEX `OrderItemCustomization_orderItemComponentId_idx`(`orderItemComponentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderAddress` (
    `id` VARCHAR(30) NOT NULL,
    `orderId` VARCHAR(30) NOT NULL,
    `countryCode` CHAR(2) NOT NULL DEFAULT 'ES',
    `postalCode` VARCHAR(10) NOT NULL,
    `province` VARCHAR(100) NOT NULL,
    `city` VARCHAR(150) NOT NULL,
    `street` VARCHAR(191) NOT NULL,
    `streetNumber` VARCHAR(30) NOT NULL,
    `additionalLine` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `OrderAddress_orderId_key`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Shipment` (
    `id` VARCHAR(30) NOT NULL,
    `orderId` VARCHAR(30) NOT NULL,
    `kind` ENUM('HOME', 'PICKUP') NOT NULL,
    `carrier` ENUM('SEUR') NOT NULL DEFAULT 'SEUR',
    `trackingNumber` VARCHAR(191) NULL,
    `trackingUrl` VARCHAR(2048) NULL,
    `pickupExternalId` VARCHAR(191) NULL,
    `pickupName` VARCHAR(191) NULL,
    `pickupAddress` VARCHAR(255) NULL,
    `pickupPostalCode` VARCHAR(10) NULL,
    `pickupCity` VARCHAR(150) NULL,
    `pickupLatitude` DECIMAL(10, 7) NULL,
    `pickupLongitude` DECIMAL(10, 7) NULL,
    `shippedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Shipment_orderId_key`(`orderId`),
    INDEX `Shipment_kind_shippedAt_idx`(`kind`, `shippedAt`),
    INDEX `Shipment_trackingNumber_idx`(`trackingNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShippingMethod` (
    `id` VARCHAR(30) NOT NULL,
    `kind` ENUM('HOME', 'PICKUP') NOT NULL,
    `displayName` VARCHAR(100) NOT NULL,
    `priceCents` INTEGER UNSIGNED NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ShippingMethod_kind_key`(`kind`),
    INDEX `ShippingMethod_isEnabled_sortOrder_idx`(`isEnabled`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(30) NOT NULL,
    `orderId` VARCHAR(30) NOT NULL,
    `provider` ENUM('STRIPE') NOT NULL DEFAULT 'STRIPE',
    `stripeCheckoutSessionId` VARCHAR(255) NOT NULL,
    `stripePaymentIntentId` VARCHAR(255) NULL,
    `status` ENUM('PAID', 'PARTIALLY_REFUNDED', 'REFUNDED') NOT NULL DEFAULT 'PAID',
    `amountCents` INTEGER UNSIGNED NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'EUR',
    `paidAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_orderId_key`(`orderId`),
    UNIQUE INDEX `Payment_stripeCheckoutSessionId_key`(`stripeCheckoutSessionId`),
    UNIQUE INDEX `Payment_stripePaymentIntentId_key`(`stripePaymentIntentId`),
    INDEX `Payment_status_paidAt_idx`(`status`, `paidAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Refund` (
    `id` VARCHAR(30) NOT NULL,
    `paymentId` VARCHAR(30) NOT NULL,
    `stripeRefundId` VARCHAR(255) NOT NULL,
    `amountCents` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED') NOT NULL,
    `reason` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Refund_stripeRefundId_key`(`stripeRefundId`),
    INDEX `Refund_paymentId_createdAt_idx`(`paymentId`, `createdAt`),
    INDEX `Refund_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StripeEvent` (
    `id` VARCHAR(30) NOT NULL,
    `stripeEventId` VARCHAR(255) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `processingStatus` ENUM('RECEIVED', 'PROCESSED', 'FAILED') NOT NULL DEFAULT 'RECEIVED',
    `errorSummary` VARCHAR(500) NULL,

    UNIQUE INDEX `StripeEvent_stripeEventId_key`(`stripeEventId`),
    INDEX `StripeEvent_processingStatus_receivedAt_idx`(`processingStatus`, `receivedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CouponRedemption` (
    `id` VARCHAR(30) NOT NULL,
    `couponId` VARCHAR(30) NOT NULL,
    `orderId` VARCHAR(30) NOT NULL,
    `discountCents` INTEGER UNSIGNED NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CouponRedemption_orderId_key`(`orderId`),
    INDEX `CouponRedemption_couponId_createdAt_idx`(`couponId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderStatusHistory` (
    `id` VARCHAR(30) NOT NULL,
    `orderId` VARCHAR(30) NOT NULL,
    `fromStatus` ENUM('RECEIVED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED') NULL,
    `toStatus` ENUM('RECEIVED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL,
    `changedByAdminUserId` VARCHAR(30) NULL,
    `source` ENUM('SYSTEM', 'ADMIN', 'STRIPE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderStatusHistory_orderId_createdAt_idx`(`orderId`, `createdAt`),
    INDEX `OrderStatusHistory_changedByAdminUserId_idx`(`changedByAdminUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailDelivery` (
    `id` VARCHAR(30) NOT NULL,
    `orderId` VARCHAR(30) NULL,
    `type` ENUM('ORDER_RECEIVED', 'ORDER_SHIPPED', 'ORDER_CANCELLED_OR_REFUNDED', 'ADMIN_NEW_ORDER') NOT NULL,
    `recipient` VARCHAR(320) NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `attemptCount` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `lastAttemptAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `lastErrorSummary` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmailDelivery_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `EmailDelivery_orderId_type_idx`(`orderId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(30) NOT NULL,
    `adminUserId` VARCHAR(30) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entityType` VARCHAR(100) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `changeSummary` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_adminUserId_createdAt_idx`(`adminUserId`, `createdAt`),
    INDEX `AuditLog_entityType_entityId_createdAt_idx`(`entityType`, `entityId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoreSettings` (
    `id` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `storeName` VARCHAR(191) NOT NULL,
    `supportEmail` VARCHAR(320) NOT NULL,
    `deliveryEstimateText` VARCHAR(500) NOT NULL,
    `globalNotice` VARCHAR(500) NULL,
    `globalNoticeEnabled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AdminRecoveryCode` ADD CONSTRAINT `AdminRecoveryCode_adminUserId_fkey` FOREIGN KEY (`adminUserId`) REFERENCES `AdminUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Drop` ADD CONSTRAINT `Drop_heroMediaId_fkey` FOREIGN KEY (`heroMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_sizeGuideId_fkey` FOREIGN KEY (`sizeGuideId`) REFERENCES `SizeGuide`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductSize` ADD CONSTRAINT `ProductSize_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductSize` ADD CONSTRAINT `ProductSize_sizeId_fkey` FOREIGN KEY (`sizeId`) REFERENCES `Size`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SizeGuide` ADD CONSTRAINT `SizeGuide_mediaAssetId_fkey` FOREIGN KEY (`mediaAssetId`) REFERENCES `MediaAsset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_mediaAssetId_fkey` FOREIGN KEY (`mediaAssetId`) REFERENCES `MediaAsset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductCustomization` ADD CONSTRAINT `ProductCustomization_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BundleComponent` ADD CONSTRAINT `BundleComponent_bundleProductId_fkey` FOREIGN KEY (`bundleProductId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BundleComponent` ADD CONSTRAINT `BundleComponent_componentProductId_fkey` FOREIGN KEY (`componentProductId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DropProduct` ADD CONSTRAINT `DropProduct_dropId_fkey` FOREIGN KEY (`dropId`) REFERENCES `Drop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DropProduct` ADD CONSTRAINT `DropProduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DropProduct` ADD CONSTRAINT `DropProduct_marketingMediaId_fkey` FOREIGN KEY (`marketingMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DropProductCustomization` ADD CONSTRAINT `DropProductCustomization_dropProductId_fkey` FOREIGN KEY (`dropProductId`) REFERENCES `DropProduct`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DropProductCustomization` ADD CONSTRAINT `DropProductCustomization_productCustomizationId_fkey` FOREIGN KEY (`productCustomizationId`) REFERENCES `ProductCustomization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DropProductCustomization` ADD CONSTRAINT `DropProductCustomization_bundleComponentId_fkey` FOREIGN KEY (`bundleComponentId`) REFERENCES `BundleComponent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Coupon` ADD CONSTRAINT `Coupon_dropId_fkey` FOREIGN KEY (`dropId`) REFERENCES `Drop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CheckoutAttempt` ADD CONSTRAINT `CheckoutAttempt_dropId_fkey` FOREIGN KEY (`dropId`) REFERENCES `Drop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CheckoutAttempt` ADD CONSTRAINT `CheckoutAttempt_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_checkoutAttemptId_fkey` FOREIGN KEY (`checkoutAttemptId`) REFERENCES `CheckoutAttempt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_dropId_fkey` FOREIGN KEY (`dropId`) REFERENCES `Drop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_dropProductId_fkey` FOREIGN KEY (`dropProductId`) REFERENCES `DropProduct`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItemComponent` ADD CONSTRAINT `OrderItemComponent_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItemCustomization` ADD CONSTRAINT `OrderItemCustomization_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItemCustomization` ADD CONSTRAINT `OrderItemCustomization_orderItemComponentId_fkey` FOREIGN KEY (`orderItemComponentId`) REFERENCES `OrderItemComponent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderAddress` ADD CONSTRAINT `OrderAddress_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shipment` ADD CONSTRAINT `Shipment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CouponRedemption` ADD CONSTRAINT `CouponRedemption_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CouponRedemption` ADD CONSTRAINT `CouponRedemption_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderStatusHistory` ADD CONSTRAINT `OrderStatusHistory_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderStatusHistory` ADD CONSTRAINT `OrderStatusHistory_changedByAdminUserId_fkey` FOREIGN KEY (`changedByAdminUserId`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmailDelivery` ADD CONSTRAINT `EmailDelivery_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_adminUserId_fkey` FOREIGN KEY (`adminUserId`) REFERENCES `AdminUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain invariants not expressible in the Prisma schema.
ALTER TABLE `Drop`
    ADD CONSTRAINT `chk_drop_dates` CHECK (
        (`startsAt` IS NULL AND `endsAt` IS NULL)
        OR (`startsAt` IS NOT NULL AND `endsAt` IS NOT NULL AND `endsAt` > `startsAt`)
    ),
    ADD CONSTRAINT `chk_drop_published_dates` CHECK (
        `status` <> 'PUBLISHED' OR (`startsAt` IS NOT NULL AND `endsAt` IS NOT NULL)
    );

ALTER TABLE `Redirect`
    ADD CONSTRAINT `chk_redirect_status_301` CHECK (`statusCode` = 301);

ALTER TABLE `ProductCustomization`
    ADD CONSTRAINT `chk_product_customization_config` CHECK (
        (`type` = 'NAME' AND `maxLength` IS NOT NULL AND `maxLength` > 0 AND `minNumber` IS NULL AND `maxNumber` IS NULL)
        OR (`type` = 'NUMBER' AND `maxLength` IS NULL AND `minNumber` = 0 AND `maxNumber` = 99)
    );

ALTER TABLE `BundleComponent`
    ADD CONSTRAINT `chk_bundle_component_quantity` CHECK (`quantity` > 0);

ALTER TABLE `DropProduct`
    ADD CONSTRAINT `chk_drop_product_compare_at` CHECK (
        `compareAtPriceCents` IS NULL OR `compareAtPriceCents` > `priceCents`
    );

ALTER TABLE `Coupon`
    ADD CONSTRAINT `chk_coupon_value` CHECK (
        (`type` = 'PERCENT' AND `value` BETWEEN 1 AND 100)
        OR (`type` = 'FIXED' AND `value` > 0)
    ),
    ADD CONSTRAINT `chk_coupon_dates` CHECK (
        `startsAt` IS NULL OR `endsAt` IS NULL OR `endsAt` > `startsAt`
    );

ALTER TABLE `CheckoutAttempt`
    ADD CONSTRAINT `chk_checkout_attempt_totals` CHECK (
        `currency` = 'EUR'
        AND `subtotalCents` >= `discountCents`
        AND `totalCents` = (`subtotalCents` - `discountCents`) + `shippingCents`
    );

ALTER TABLE `Order`
    ADD CONSTRAINT `chk_order_totals` CHECK (
        `currency` = 'EUR'
        AND `subtotalCents` >= `discountCents`
        AND `totalCents` = (`subtotalCents` - `discountCents`) + `shippingCents`
    );

ALTER TABLE `OrderItem`
    ADD CONSTRAINT `chk_order_item_totals` CHECK (
        `quantity` > 0
        AND `unitTotalCents` = `unitBasePriceCents` + `unitCustomizationCents`
        AND `lineTotalCents` = `unitTotalCents` * `quantity`
    );

ALTER TABLE `OrderAddress`
    ADD CONSTRAINT `chk_order_address_country` CHECK (`countryCode` = 'ES');

ALTER TABLE `Shipment`
    ADD CONSTRAINT `chk_shipment_pickup_snapshot` CHECK (
        (
            `kind` = 'HOME'
            AND `pickupExternalId` IS NULL
            AND `pickupName` IS NULL
            AND `pickupAddress` IS NULL
            AND `pickupPostalCode` IS NULL
            AND `pickupCity` IS NULL
            AND `pickupLatitude` IS NULL
            AND `pickupLongitude` IS NULL
        )
        OR (
            `kind` = 'PICKUP'
            AND `pickupExternalId` IS NOT NULL
            AND `pickupName` IS NOT NULL
            AND `pickupAddress` IS NOT NULL
            AND `pickupPostalCode` IS NOT NULL
            AND `pickupCity` IS NOT NULL
            AND (
                (`pickupLatitude` IS NULL AND `pickupLongitude` IS NULL)
                OR (`pickupLatitude` BETWEEN -90 AND 90 AND `pickupLongitude` BETWEEN -180 AND 180)
            )
        )
    );

ALTER TABLE `Payment`
    ADD CONSTRAINT `chk_payment_amount` CHECK (`currency` = 'EUR' AND `amountCents` > 0);

ALTER TABLE `Refund`
    ADD CONSTRAINT `chk_refund_amount` CHECK (`amountCents` > 0);

ALTER TABLE `StoreSettings`
    ADD CONSTRAINT `chk_store_settings_singleton` CHECK (`id` = 1);
