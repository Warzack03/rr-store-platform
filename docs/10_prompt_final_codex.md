# Documento 10 — Prompt final autocontenido para Codex

## Prompt

Quiero que trabajes como ingeniero senior full-stack responsable de implementar una nueva tienda ecommerce propia para Rising Raimon.

Debes trabajar en un repositorio independiente llamado `rr-store-platform`.

No integres el ecommerce dentro del repositorio de la plataforma deportiva existente.

## 1. Contexto

Rising Raimon tiene:

- web deportiva pública: `https://risingraimon.es`
- backoffice deportivo: `https://risingraimon.es/admin`
- tienda WooCommerce actual: `https://tienda.risingraimon.es`

La nueva aplicación sustituirá WooCommerce cuando esté terminada y validada.

Durante desarrollo/beta utilizará `https://tienda-beta.risingraimon.es`.

La tienda debe ser completamente independiente de la aplicación deportiva. Puede compartir logo, colores, tipografías, identidad visual y enlaces. No puede depender para comprar de su BBDD, API, sesión o filesystem.

## 2. Regla principal de trabajo

NO implementes toda la tienda en una sola tarea.

Trabaja por fases pequeñas, verificables y con pruebas.

Antes de una modificación grande:

1. inspecciona el repositorio;
2. entiende la fase actual;
3. limita el cambio al alcance pedido;
4. explica brevemente el plan;
5. implementa;
6. ejecuta pruebas/typecheck/lint relevantes;
7. resume qué cambió y qué queda fuera.

No sobreimplementes. Si una función está fuera del MVP, no la construyas por si pudiera ser útil.

## 3. Stack

Usar:

- Next.js App Router;
- React;
- TypeScript strict;
- Tailwind CSS;
- Prisma;
- MySQL/MariaDB;
- Auth.js;
- Zod;
- Node.js;
- Stripe Checkout alojado;
- SMTP Hostinger;
- Playwright para E2E.

No introducir sin una necesidad aprobada Redis, Sentry, Datadog, Elasticsearch, colas externas, microservicios, backend separado, CMS o almacenamiento de pago.

## 4. Hostinger

Infraestructura: Hostinger Business Web Hosting.

Principios:

- aplicación Node.js;
- deploy desde GitHub;
- MySQL;
- pool pequeño, objetivo alrededor de 5 conexiones;
- secretos en variables de entorno;
- SSL/CDN Hostinger;
- backups Hostinger;
- un deploy puede sustituir el directorio de la aplicación;
- las imágenes deben vivir fuera de ese directorio, en almacenamiento persistente;
- nunca guardar imágenes como BLOB;
- beta y producción tienen BBDD y media separadas.

La ruta de media NO debe hardcodearse. Usar `MEDIA_ROOT` y guardar rutas relativas en BBDD. La ruta real se confirmará por entorno.

## 5. Git y entornos

Entornos: local, beta y producción.

`beta` → auto deploy a `tienda-beta.risingraimon.es`.

`main` → auto deploy a `tienda.risingraimon.es`.

El usuario desarrolla solo; no introducir GitFlow complejo.

Beta: BBDD propia, Stripe test, noindex, acceso protegido y media propia.

Producción: BBDD propia, Stripe live, SMTP real, operativa manual mediante SEUR Pro y media propia.

## 6. Identidad UX/UI

La tienda debe conservar la identidad de `risingraimon.es`:

- fondo navy oscuro;
- dorado/amarillo;
- blanco;
- tipografía deportiva/condensada en titulares;
- paneles oscuros;
- contraste alto;
- bordes moderadamente rectos;
- aspecto moderno y serio.

Toma la web deportiva como fuente de verdad de paleta, logo y tipografías, pero adapta la experiencia a ecommerce.

### Regla crítica de contenido

TODO texto visible debe parecer contenido final para comprador o administrador.

NO mostrar frases como `documento extraído de base de datos`, `datos obtenidos de API`, `webhook recibido`, errores SQL/foreign key, IDs internos, explicaciones de implementación, anotaciones de IA o debug.

El público ve lenguaje comercial. El admin ve lenguaje operativo. Los detalles técnicos quedan en logs.

## 7. Mobile-first, accesibilidad y rendimiento

La tienda pública se diseña primero para móvil. Desktop amplía el mismo flujo.

Backoffice responsive, pero tablas/exportaciones pueden estar más optimizadas para desktop.

Objetivo WCAG 2.2 AA.

Lighthouse orientativo:

- Accessibility >= 95
- Best Practices >= 95
- SEO >= 95
- Desktop Performance >= 90
- Mobile Performance >= 80

Core Web Vitals objetivo:

- LCP <= 2,5 s
- CLS <= 0,1
- INP <= 200 ms

Usar Server Components por defecto, Client Components solo cuando hagan falta, fuentes autohospedadas, imágenes responsive y `prefers-reduced-motion`.

## 8. Modelo comercial

Rising Raimon vende principalmente camisetas, pantalones y equipaciones completas.

Se trabaja por drops y se fabrica después de cerrar el periodo de venta.

NO hay inventario en el MVP.

Flujo real:

1. abrir drop;
2. recibir pedidos pagados;
3. cerrar drop;
4. exportar necesidades;
5. gestionar proveedor fuera de esta app;
6. fabricar;
7. recibir prendas;
8. tramitar y enviar manualmente mediante SEUR Pro.

No implementar stock ni reservas.

## 9. Productos

Un `Product` representa una prenda/diseño concreto de temporada, por ejemplo `Camiseta primera equipación 26/27`.

Si cambia el diseño, crear otro Product.

Un Product puede aparecer en varios drops.

Tipos: `SIMPLE` y `BUNDLE`.

La equipación es un `BUNDLE` formado por camiseta y pantalón.

## 10. Tallas

Tallas configurables desde admin, nunca hardcodeadas.

Ejemplos actuales: `8`, `10`, `12`, `XS`, `S`, `M`, `L`, `XL`, `2XL`.

Las tallas pertenecen al producto y son iguales en todos sus drops. Orden manual. Todas cuestan lo mismo.

## 11. Personalización

Camiseta: talla, nombre opcional, dorsal opcional.

Pantalón: talla, dorsal opcional.

Equipación: talla camiseta, nombre camiseta, dorsal camiseta, talla pantalón, dorsal pantalón.

Nombre: longitud máxima configurable, tildes y espacios permitidos, normalizar a MAYÚSCULAS.

Dorsal: texto `00-99`.

Nombre y dorsal tienen suplementos independientes configurables por `DropProduct`.

## 12. Drops

Entidad propia. Normalmente uno activo, pero el modelo soporta varios.

Campos: título, texto corto, hero, inicio, fin, estado borrador/publicado/archivado, principal y productos.

Estado público derivado: Próximo, Disponible, Finalizado.

Antes: mostrar imágenes, contenido, tallas, personalizaciones, guía y countdown; NO precio y NO compra.

Activo: precio, compra y countdown.

Finalizado: visible, indexable y no comprable.

Cuenta atrás: >48 h por días; <=48 h con más detalle en horas/minutos.

No crear página pública `/drops/[slug]`. La home y `/productos` representan los drops.

## 13. Precio

El precio no vive como verdad global en Product.

Usar `DropProduct` con `priceCents` y `compareAtPriceCents` opcional.

Importes en céntimos enteros, nunca float.

Precios finales con IVA incluido.

## 14. Home

### Drop activo

Hero, título, texto corto, `Disponible hasta...`, cuenta atrás, CTA `Ver productos` y productos con igual jerarquía.

### Próximo

Hero, fecha, cuenta atrás y productos sin precio.

### Ninguno

Mensaje tipo `Estamos preparando el próximo drop`, históricos y enlace al club.

## 15. Productos públicos

Rutas: `/productos` y `/productos/[slug]`.

Sin categorías, buscador ni filtros en el MVP.

Ficha:

1. galería;
2. nombre;
3. estado;
4. precio;
5. descripción corta;
6. talla;
7. guía;
8. personalizaciones;
9. cantidad;
10. total;
11. CTA;
12. descripción completa;
13. relacionados del mismo drop.

CTA móvil fijo: `Total X € · Añadir al carrito`.

Guía de tallas con mensaje `¿No encuentras tu talla? Escríbenos a risingraimon@gmail.com`.

## 16. Carrito

Anónimo y persistente en navegador. No tabla Cart.

Una configuración distinta = línea distinta. Misma configuración puede tener quantity > 1.

No mezclar drops.

El servidor recalcula producto, disponibilidad, precio, suplementos, cupón, envío y total. Nunca confiar en importes del cliente.

## 17. Cupones

Tipos: porcentaje y fijo.

Configurable: código, valor, drop opcional, fechas, mínimo, máximo de usos y activo.

Reglas: uno por pedido, no stacking, sin límite por cliente, sin promociones por volumen y sin envío gratis.

## 18. Clientes

Solo compra como invitado.

NO Customer, cuenta, registro ni historial autenticado.

Pedido accesible mediante token privado.

## 19. Checkout

Una página.

Orden:

1. contacto;
2. dirección de entrega a domicilio;
3. resumen;
4. cupón;
5. observaciones;
6. consentimiento;
7. Stripe.

Datos: nombre, apellidos, email, teléfono.

No DNI por defecto. No dirección de facturación separada.

Si necesita factura personalizada: `risingraimon@gmail.com`.

Consentimiento: condiciones + privacidad. Sin marketing.

## 20. Zona y envíos

Solo España peninsular. País fijo España. Validación server-side por CP. Rechazar Canarias, Baleares, Ceuta y Melilla.

Método único del MVP: HOME, con tarifa inicial de 4,99 €.

La tarifa y la activación del envío a domicilio son configurables. Nunca hardcodear importes.

## 21. SEUR

El usuario tiene SEUR Pro.

El MVP no consume ninguna API de SEUR ni permite seleccionar puntos de recogida. Las expediciones, etiquetas, consultas de entrega e incidencias se gestionan manualmente en SEUR Pro.

La aplicación guarda tracking y URL opcionales introducidos por el administrador. Ante una entrega fallida, el comprador contacta por email y el administrador gestiona la incidencia fuera de la aplicación.

## 22. Stripe

Stripe Checkout alojado. Tarjeta y Apple Pay/Google Pay cuando Stripe lo ofrezca.

Flujo: validar → CheckoutAttempt → Session → redirect → webhook firmado → transacción → Order → email.

Return URL NO es fuente de verdad.

Numeración de pedido desde `#1`.

Checkout iniciado antes del cierre puede completar durante 30 minutos.

Pagos fallidos/abandonados: sin pedido, número ni email.

Reembolsos: desde Stripe Dashboard, parciales/totales, sincronizados por webhook.

## 23. Pedidos

Estado operativo: `RECEIVED`, `IN_PRODUCTION`, `SHIPPED`, `DELIVERED`, `CANCELLED`.

Estado financiero separado: `PAID`, `PARTIALLY_REFUNDED`, `REFUNDED`.

Al cerrar drop: exportar fabricación y batch `IN_PRODUCTION`.

Envío: uno por uno, tracking/URL opcionales y email.

Entregado: manual tras consultar SEUR.

Notas internas admitidas.

## 24. Exportación de fabricación

CSV compatible con Excel, con una fila por producto físico: referencia, producto pedido, componente del pack si existe, producto de fabricación, cantidad, talla, nombre y dorsal. Debe admitir packs flexibles con cualquier número de componentes.

No incluir email, teléfono ni dirección.

## 25. Pedido privado

Ruta `/pedido/[token]`.

Token largo, aleatorio, no predecible y sin caducidad automática mientras se conserve el pedido.

No buscador público.

Timeline `Pedido recibido → En fabricación → Enviado → Entregado`.

## 26. Correos

SMTP Hostinger.

Remitente dedicado del dominio. Reply-To/soporte `risingraimon@gmail.com`.

Emails comprador: recibido, enviado y cancelación/reembolso si ocurre.

Admin: aviso por pedido pagado.

Un fallo SMTP no revierte el pedido. Registrar `EmailDelivery` y permitir reenvío.

## 27. Fiscalidad y legal

Todos los precios visibles incluyen IVA.

NO construir un sistema fiscal de facturación en el MVP.

NO emitir factura fiscal propia. El correo es confirmación de pedido.

Páginas estáticas:

- `/aviso-legal`
- `/privacidad`
- `/cookies`
- `/condiciones-de-compra`
- `/envios`
- `/cambios-y-devoluciones`

No CMS.

Textos y procedimientos legales/fiscales se validan con asesoría antes de producción.

## 28. Backoffice

Navegación: Inicio, Drops, Productos, Pedidos, Cupones, Guías de tallas, Medios, Configuración, Auditoría.

Dashboard: drop, recibidos, producción, enviados, importe y últimos pedidos. Sin gráficas decorativas.

### Productos

Información, imágenes, tallas, personalización, guía y componentes. Duplicar crea borrador.

### Drops

Información, fechas, hero, productos y estado. Vista previa. Duplicar copia configuración, queda borrador y obliga a nuevas fechas.

### Pedidos

Listado con número, fecha, cliente, total, drop, estado y envío. Búsqueda por número/nombre/email. Detalle con estado, productos, entrega, pago, cupón, notas, tracking e historial.

## 29. Admin auth

Una sola cuenta inicialmente.

Auth.js + Argon2id + TOTP compatible con Authy/Google/Microsoft + recovery codes hasheados de un uso.

Sesión ~8 h.

No registro, forgot password por email ni roles complejos.

Autorización siempre server-side.

## 30. Medios

Biblioteca reutilizable.

Uploads JPG/JPEG, PNG y WebP. No SVG.

Validar MIME, tamaño y dimensiones razonables.

No sobrescribir ficheros al reemplazar.

Guardar fuera del directorio desplegable usando `MEDIA_ROOT`.

## 31. Modelo de datos

Implementar:

- AdminUser
- AdminRecoveryCode
- Drop
- Product
- Redirect
- Size
- ProductSize
- SizeGuide
- MediaAsset
- ProductImage
- ProductCustomization
- BundleComponent
- DropProduct
- DropProductCustomization
- Coupon
- CheckoutAttempt
- Order
- OrderItem
- OrderItemComponent
- OrderItemCustomization
- OrderAddress
- Shipment
- ShippingMethod
- Payment
- Refund
- StripeEvent
- CouponRedemption
- OrderStatusHistory
- EmailDelivery
- AuditLog
- StoreSettings

No implementar Customer, CustomerAddress, Inventory, InventoryMovement, TaxRate, Invoice, ImportBatch ni ImportBatchItem.

Pedidos deben guardar snapshots históricos de nombres, precios, tallas, personalizaciones, descuentos y envío.

## 32. Seguridad

Obligatorio:

- Zod server-side;
- auth/autorización server-side;
- CSRF/origin apropiado;
- rate limit login/2FA/checkout;
- Stripe signature;
- idempotencia;
- precios recalculados server-side;
- cookies seguras;
- CSP;
- HSTS en producción;
- secretos solo en env;
- no secretos en logs;
- no datos de tarjeta;
- uploads restringidos;
- token privado de pedido;
- errores sin detalles internos.

## 33. SEO

- canonical;
- metadata;
- Open Graph;
- sitemap;
- robots;
- Product/Offer;
- redirects 301;
- Search Console.

Antes de drop: indexable, sin price leak y sin Offer con precio.

Finalizado: indexable y no comprable.

Beta: noindex.

No GA4, Meta Pixel o TikTok Pixel en el MVP.

## 34. Logs

Muy mínimos. Un fichero warning/error es suficiente. No registrar cada visita. No añadir Sentry.

## 35. Migración WooCommerce

No migrar clientes, pedidos ni cupones. Crear catálogo manualmente. Copiar imágenes seleccionadas a media nueva. Los slugs pueden cambiar; crear 301 útiles. Mantener WordPress unos meses como archivo/rollback.

## 36. Roadmap obligatorio

Implementar aproximadamente en este orden:

1. base técnica y diseño;
2. modelo de datos;
3. catálogo público;
4. admin catálogo;
5. carrito/cupones;
6. checkout + Stripe test;
7. descartada: SEUR Pickup no disponible para la cuenta actual;
8. operación de pedidos, con envío y tracking registrados manualmente;
9. emails/configuración;
10. SEO/legal/hardening;
11. corte.

No avanzar de fase sin cerrar y validar la actual.

## 37. Criterios de aceptación

Cada fase debe ejecutar lo relevante entre lint, typecheck, unit tests, integration tests, Playwright y build.

Para lanzamiento: Stripe live, webhook, SMTP, operativa manual SEUR Pro y tracking, backup/restore, legal/fiscal, WCAG AA, responsive, SEO y performance.

## 38. Primera tarea concreta

Empieza ÚNICAMENTE por la Fase 1.

No implementes productos, Stripe, checkout ni pedidos todavía.

### Fase 1 — Base técnica y sistema visual

Objetivo: crear `rr-store-platform` ejecutable, desplegable y preparado para las fases siguientes.

Tareas:

1. inicializar/inspeccionar el repo;
2. configurar Next.js App Router + TypeScript strict;
3. configurar Tailwind;
4. configurar lint/typecheck;
5. añadir Zod para variables de entorno;
6. configurar Prisma y conexión MySQL sin crear todavía todo el esquema ecommerce;
7. garantizar singleton/pool razonable para Hostinger;
8. crear estructura por dominios;
9. crear layout público;
10. crear shell `/admin` todavía sin negocio;
11. extraer de `risingraimon.es` la identidad visual necesaria y crear tokens;
12. configurar fuentes autohospedadas cuando sea viable;
13. implementar navegación pública mínima;
14. implementar 404 final;
15. implementar `/api/health` sin datos sensibles;
16. preparar `noindex` configurable para beta;
17. preparar cabeceras de seguridad base;
18. documentar variables de entorno sin valores secretos;
19. añadir README de ejecución local, beta y producción;
20. ejecutar build, lint y typecheck.

Criterio de finalización:

- la aplicación arranca;
- build pasa;
- lint pasa;
- typecheck pasa;
- Prisma conecta;
- health responde;
- diseño base es coherente con Rising Raimon;
- móvil y desktop funcionan;
- no hay funcionalidades ecommerce adelantadas;
- no hay texto técnico visible al usuario.

Al terminar informa:

- archivos relevantes modificados;
- decisiones técnicas tomadas;
- comandos ejecutados y resultado;
- riesgos encontrados;
- qué NO has implementado;
- propuesta concreta para la Fase 2.

No avances a Fase 2 sin una nueva instrucción.
