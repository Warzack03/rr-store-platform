# Documento 1 — Visión y alcance

## 1. Objetivo

Crear una nueva plataforma ecommerce propia para Rising Raimon que sustituya completamente a la tienda actual basada en WordPress/WooCommerce, manteniendo la tienda antigua operativa hasta que la nueva solución esté terminada, probada y preparada para asumir `tienda.risingraimon.es`.

La nueva tienda será una aplicación independiente de la plataforma deportiva de `risingraimon.es`, con repositorio, aplicación Node.js, base de datos, secretos, almacenamiento de medios y backoffice propios.

El repositorio se llamará `rr-store-platform`.

La solución debe priorizar simplicidad operativa, seguridad, rendimiento móvil, experiencia de compra mobile-first, coherencia visual con Rising Raimon, operación en Hostinger sin infraestructura externa innecesaria, ausencia de sobreingeniería y textos finales orientados a comprador o administrador, nunca anotaciones técnicas de implementación.

## 2. Usuarios

### Comprador

Persona que accede a la tienda principalmente desde móvil para descubrir el drop activo o próximo, consultar productos, revisar imágenes y guía de tallas, configurar talla y personalización, añadir al carrito, aplicar cupón, indicar una dirección de entrega a domicilio, pagar con Stripe, recibir confirmación y consultar el estado mediante un enlace privado. No necesita crear cuenta.

### Administrador

Inicialmente una única persona responsable de productos, drops, precios, suplementos, imágenes, guías, cupones, pedidos, exportación para fabricación, estados, tracking, tarifas, configuración y auditoría. Accede con email, contraseña y segundo factor TOTP.

## 3. Problema

La tienda actual depende de WordPress, WooCommerce y plugins para necesidades que en Rising Raimon son más reducidas. El negocio se basa principalmente en drops de prendas que se fabrican después de cerrar el periodo de venta. Esto permite una solución propia más simple que un ecommerce generalista con inventario, cuentas, ERP, newsletter o reglas promocionales complejas.

La nueva plataforma debe cubrir las necesidades reales sin reconstruir WooCommerce.

## 4. MVP

### Catálogo

- Productos de temporada/diseño concretos.
- Tipos `SIMPLE` y `BUNDLE`.
- Camiseta, pantalón y equipación completa.
- Varias imágenes por producto.
- Guía de tallas reutilizable.
- Tallas configurables desde backoffice.
- Descripción corta y completa.
- Estado borrador, publicado y archivado.
- Slug y SEO.
- Precio por producto dentro de cada drop.
- Precio anterior opcional para mostrar rebajas.
- Personalización opcional con suplemento configurable.

### Personalización

Camiseta: talla, nombre opcional y dorsal opcional.

Pantalón: talla y dorsal opcional.

Equipación completa: talla de camiseta, nombre de camiseta, dorsal de camiseta, talla de pantalón y dorsal de pantalón.

Reglas: nombres en mayúsculas, se permiten tildes y espacios, longitud máxima configurable, dorsal como texto `00-99`, suplementos configurables y tallas sin variación de precio.

### Drops

- Entidad propia.
- Un producto puede aparecer en varios drops.
- Un drop puede contener camiseta, pantalón y equipación.
- Fechas de inicio y fin.
- Hero configurable.
- Estado administrativo borrador/publicado/archivado.
- Estado público calculado: próximo, disponible o finalizado.
- Cuenta atrás.
- Precio oculto antes de apertura.
- Producto visible pero no comprable antes del inicio ni después del cierre.
- Soporte técnico para más de un drop simultáneo, aunque operativamente se prevé uno.
- Un carrito no mezcla drops distintos.

### Compra

- Compra como invitado.
- Sin cuentas de cliente.
- Carrito anónimo persistente en navegador.
- Sin inventario ni reserva de stock en el MVP.
- Checkout de una sola página.
- Validación completa en servidor.
- Stripe Checkout alojado.
- Tarjeta y Apple Pay/Google Pay cuando Stripe y el dispositivo lo permitan.
- Solo España peninsular.
- Envío a domicilio en España peninsular.
- Cupones configurables.
- Confirmación de pedido.
- Consulta de pedido mediante token privado.

### Pedidos

Flujo operativo: `Pedido recibido → En fabricación → Enviado → Entregado`.

Estado excepcional: cancelado. La dimensión financiera mantiene pagado, reembolsado parcialmente y reembolsado.

`Pedido recibido` implica pago confirmado.

### Operación del drop

Cuando termina un drop se exportan los datos necesarios para fabricación, los pedidos pueden marcarse en lote como `En fabricación`, el proceso con el proveedor se gestiona fuera de esta aplicación, cuando llega la mercancía cada pedido se tramita manualmente con SEUR Pro, se registra tracking opcional, se marca como `Enviado` y después como `Entregado` tras comprobar SEUR. Las entregas fallidas se gestionan fuera de la aplicación con SEUR Pro cuando el comprador contacta por email.

### Administración

- Dashboard.
- Drops.
- Productos.
- Pedidos.
- Cupones.
- Guías de tallas.
- Medios.
- Configuración.
- Auditoría.
- Exportación de fabricación.
- Duplicación de productos y drops.
- Vista previa de drops.

### Correos

- Pedido recibido al comprador.
- Pedido enviado al comprador.
- Aviso interno por nuevo pedido pagado.
- Comunicación de cancelación/reembolso cuando proceda.
- Reintento manual de email fallido.

### SEO

- URLs limpias.
- Slugs editables.
- Historial de redirects 301.
- Canonical y Open Graph.
- Sitemap y robots.
- Product/Offer cuando corresponda.
- Productos finalizados indexables.
- Google Search Console desde el lanzamiento.

## 5. Fuera del MVP

No implementar inicialmente cuentas de cliente, registro público, recuperación de contraseña de clientes, direcciones guardadas, inventario, movimientos o reservas de stock, categorías, etiquetas, buscador, filtros, wishlist, reseñas, newsletter, recuperación de carrito abandonado, avisos de reposición, GA4, píxeles publicitarios, Merchant Center, envío gratuito por importe, promociones por volumen, cupones acumulables, límite de cupón por cliente, facturación fiscal propia, albaranes, sistema de tickets, selección de puntos Pickup, integración con API de SEUR, creación automática de expediciones o etiquetas SEUR, gestión automática de incidencias de transporte, Redis, Sentry, colas externas, microservicios, importación masiva de WooCommerce, migración de clientes/pedidos históricos ni CMS para páginas legales.

## 6. Evolución futura

Sin comprometer el MVP, el diseño debe permitir posteriormente inventario real, preventas, categorías, varios drops simultáneos operativos, cuentas de cliente, integración SEUR más profunda, analítica, facturación fiscal si se valida, nuevos roles y más reglas promocionales.

Estas posibilidades no justifican implementar hoy funcionalidad no utilizada.

## 7. Decisiones cerradas

- Aplicación independiente de `risingraimon.es`.
- Repositorio `rr-store-platform`.
- Next.js full-stack.
- MySQL propio y Prisma.
- Hostinger.
- Beta y producción separadas.
- Mobile-first.
- Compra invitada.
- Drops temporales sin stock en el MVP.
- Catálogo maestro reutilizable por drop.
- Precio comercial en la relación producto/drop.
- Stripe Checkout.
- Solo entrega a domicilio en el MVP.
- Operativa SEUR completamente manual mediante SEUR Pro; la tienda solo guarda tracking y URL opcionales.
- Entregas fallidas gestionadas por el administrador cuando el comprador contacta por email.
- Precios con IVA incluido.
- Sin sistema fiscal propio en el MVP.
- WooCommerce histórico no se migra.
- Productos creados manualmente.
- Imágenes copiadas al almacenamiento propio.
- Backoffice con una sola cuenta y TOTP.
- Hostinger SMTP.
- Search Console sí; analítica publicitaria no.
- WCAG 2.2 AA.
- Contenido visible siempre final, comercial u operativo.
