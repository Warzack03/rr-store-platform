ALTER TABLE `EmailDelivery`
    ADD CONSTRAINT `EmailDelivery_orderId_type_recipient_key`
    UNIQUE (`orderId`, `type`, `recipient`);
