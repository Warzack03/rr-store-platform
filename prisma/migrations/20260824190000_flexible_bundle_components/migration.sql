-- Los componentes del pack dejan de estar limitados a camiseta y pantalón.
-- Se conserva una etiqueta legible para los registros existentes.
ALTER TABLE `BundleComponent`
    ADD COLUMN `label` VARCHAR(100) NULL AFTER `componentProductId`;

UPDATE `BundleComponent`
SET `label` = CASE
    WHEN `role` = 'SHIRT' THEN 'Camiseta'
    WHEN `role` = 'SHORTS' THEN 'Pantalón'
    ELSE CONCAT('Producto ', `sortOrder` + 1)
END;

CREATE INDEX `BundleComponent_bundleProductId_sortOrder_idx`
    ON `BundleComponent`(`bundleProductId`, `sortOrder`);

ALTER TABLE `BundleComponent`
    DROP INDEX `BundleComponent_bundleProductId_role_key`,
    DROP COLUMN `role`,
    MODIFY `label` VARCHAR(100) NOT NULL;

-- El snapshot de pedido también se hace genérico para soportar futuros packs.
ALTER TABLE `OrderItemComponent`
    ADD COLUMN `componentLabelSnapshot` VARCHAR(100) NULL AFTER `orderItemId`;

UPDATE `OrderItemComponent`
SET `componentLabelSnapshot` = CASE
    WHEN `role` = 'SHIRT' THEN 'Camiseta'
    WHEN `role` = 'SHORTS' THEN 'Pantalón'
    ELSE CONCAT('Producto ', `sortOrder` + 1)
END;

ALTER TABLE `OrderItemComponent`
    DROP INDEX `OrderItemComponent_orderItemId_role_key`,
    DROP COLUMN `role`,
    MODIFY `componentLabelSnapshot` VARCHAR(100) NOT NULL;
