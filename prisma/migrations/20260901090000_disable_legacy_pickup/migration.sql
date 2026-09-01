-- La cuenta actual de SEUR no ofrece el acceso necesario para Pickup.
-- Se conservan el enum y los snapshots históricos, pero el método no puede
-- ofrecerse en el checkout del MVP.
UPDATE `ShippingMethod`
SET `isEnabled` = 0
WHERE `kind` = 'PICKUP';
