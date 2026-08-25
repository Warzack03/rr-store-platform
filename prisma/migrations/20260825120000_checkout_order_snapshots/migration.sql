ALTER TABLE `CheckoutAttempt`
  ADD COLUMN `publicToken` VARCHAR(128) NULL;

UPDATE `CheckoutAttempt`
SET `publicToken` = CONCAT('legacy_', `id`)
WHERE `publicToken` IS NULL;

ALTER TABLE `CheckoutAttempt`
  MODIFY `publicToken` VARCHAR(128) NOT NULL,
  ADD UNIQUE INDEX `CheckoutAttempt_publicToken_key` (`publicToken`);

ALTER TABLE `OrderItem`
  ADD COLUMN `sizeLabelSnapshot` VARCHAR(50) NULL;
