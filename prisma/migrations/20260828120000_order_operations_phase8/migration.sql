ALTER TABLE `Order`
    ADD COLUMN `internalNotes` TEXT NULL;

ALTER TABLE `OrderItemComponent`
    ADD COLUMN `quantitySnapshot` SMALLINT UNSIGNED NOT NULL DEFAULT 1;
