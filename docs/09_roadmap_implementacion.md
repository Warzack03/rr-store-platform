# Documento 9 — Roadmap de implementación

## Principio

No construir toda la tienda en una sola tarea. Cada fase termina con algo verificable.

## Fase 1 — Base técnica y sistema visual

### Objetivo

Crear el repositorio y una aplicación desplegable vacía pero sólida.

### Tareas

- `rr-store-platform`.
- Next.js App Router.
- TypeScript strict.
- Tailwind.
- lint/typecheck.
- Zod.
- Prisma + MySQL local.
- env validation.
- layouts público/admin.
- tokens visuales de Rising Raimon.
- fuentes autohospedadas.
- navegación base.
- 404.
- `/api/health`.
- headers base.
- beta/noindex.

### Pruebas

Build, lint, typecheck, health, móvil/desktop.

### Criterio

La app corre local y puede desplegarse en beta sin ecommerce adelantado.

## Fase 2 — Modelo de datos

### Objetivo

Implementar el esquema Prisma del MVP.

### Tareas

Entidades, enums, migración inicial, seed mínimo y creación controlada del primer admin.

### Pruebas

Migrate fresh, constraints, uniques y relaciones.

### Criterio

BBDD recreable desde cero y capaz de soportar todos los casos confirmados.

## Fase 3 — Catálogo público

### Tareas

Home, estados de drop, `/productos`, ficha, galería, tallas, guía, related, no filtrado de precio pre-drop, finalizados visibles, SEO y redirects.

### Criterio

Catálogo correcto en móvil/desktop sin compra todavía.

## Fase 4 — Administración de catálogo

### Tareas

Auth.js, Argon2id, TOTP, recovery codes, dashboard, CRUD productos/tallas/guías/medios/drops, precios, suplementos, duplicación, preview, archivado y auditoría.

### Criterio

El administrador puede preparar un drop completo sin tocar BBDD.

## Fase 5 — Carrito y cupones

### Tareas

Carrito local versionado, líneas, cantidades, edición, bundles, uppercase, dorsal, cupones, validación server-side, un drop por carrito e invalidación al cerrar.

### Criterio

Carrito usable y resistente a manipulación de importes.

## Fase 6 — Checkout, envíos y Stripe test

### Tareas

Checkout de una página, Península, domicilio, ShippingMethod, observaciones, consentimiento, CheckoutAttempt, Stripe test, webhook, idempotencia, confirmación asíncrona, cancelación, pedido #1+, `/pedido/[token]`.

SEUR puede comenzar con mock.

### Criterio

Una compra Stripe test genera exactamente un pedido correcto.

## Fase 7 — SEUR Pickup real

### Tareas

Credenciales preproducción, cliente server-side, búsqueda, lista, selección, revalidación, snapshot, timeout, fallback domicilio y rate limiting.

### Criterio

Pickup funciona y una caída de SEUR no bloquea domicilio.

## Fase 8 — Operación de pedidos

### Tareas

Listado, filtros, detalle, notas, batch de fabricación, CSV/Excel, envío, tracking, entrega, historial, cancelación y refunds desde webhooks.

### Criterio

Un drop puede operarse desde cierre hasta entrega.

## Fase 9 — Correos y configuración

### Tareas

SMTP Hostinger, recibido, enviado, aviso interno, EmailDelivery, reenvío, configuración de shipping, aviso global y email soporte.

### Criterio

Los emails llegan correctamente y un fallo no rompe el pedido.

## Fase 10 — SEO, legal y hardening

### Tareas

Legales, Search Console, sitemap, robots, JSON-LD, CSP, HSTS, rate limits, uploads, performance, accesibilidad y redirects WooCommerce.

### Dependencia

Validación legal/fiscal.

### Criterio

Beta cumple seguridad, SEO y accesibilidad.

## Fase 11 — Preparación y corte

### Tareas

Catálogo definitivo, imágenes, secrets live, SEUR live, SMTP live, backup, restore test, Stripe live controlado, congelación WooCommerce, dominio, smoke tests, Search Console y WordPress archivado.

### Criterio

`tienda.risingraimon.es` sirve la nueva plataforma con rollback documentado.

## Reglas del roadmap

- No avanzar funcionalidades de fases futuras salvo dependencias mínimas.
- Cada tarea/PR debe tener criterio de aceptación.
- No añadir infraestructura externa por prevención.
- No implementar stock, cuentas, facturación fiscal o marketing no solicitado.
- Mantener contenido visible final y no técnico.
