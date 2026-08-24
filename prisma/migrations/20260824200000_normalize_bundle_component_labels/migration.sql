UPDATE `BundleComponent`
SET `label` = CONCAT('Producto ', `sortOrder` + 1);

UPDATE `OrderItemComponent`
SET `componentLabelSnapshot` = CONCAT('Producto ', `sortOrder` + 1);
