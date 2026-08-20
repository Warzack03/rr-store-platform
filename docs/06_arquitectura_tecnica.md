# Documento 6 — Arquitectura técnica

## 1. Stack

- Next.js App Router.
- React.
- TypeScript strict.
- Tailwind CSS.
- Prisma.
- MySQL/MariaDB.
- Auth.js.
- Zod.
- Node.js.
- Stripe SDK.
- SMTP Hostinger.
- API oficial SEUR Pickup server-side.
- Playwright.

Reutiliza la familia tecnológica existente de Rising Raimon y encaja con Hostinger sin infraestructura extra.

## 2. Aplicación

Una única aplicación full-stack con web pública, `/admin`, Server Actions y Route Handlers necesarios. No frontend/API separados, no microservicios.

## 3. Repositorio

`rr-store-platform`.

Estructura orientativa:

```text
src/
  app/
    (store)/
    admin/
    api/
  features/
    drops/
    products/
    cart/
    checkout/
    orders/
    payments/
    shipping/
    coupons/
    media/
  server/
    auth/
    db/
    stripe/
    seur/
    email/
    media/
    security/
    logging/
  components/
  lib/
  styles/
prisma/
scripts/
tests/
```

La nomenclatura puede ajustarse, manteniendo separación de responsabilidades.

## 4. Renderizado

Server Components por defecto para home, catálogo, producto, legales y lecturas admin. Client Components solo para carrito, galería, countdown, personalizaciones, formularios, Pickup y controles interactivos.

No convertir layouts completos en client sin necesidad.

## 5. Dominio

La UI no contiene reglas profundas. Encapsular casos de uso como obtener drops, validar carrito, calcular checkout, crear Stripe Checkout, crear pedido pagado, cambiar estados, aplicar cupón o buscar Pickup.

## 6. Prisma/MySQL

- Prisma como acceso normal.
- Pool pequeño, objetivo ~5 conexiones cuando el entorno lo permita.
- Singleton de Prisma.
- Queries selectivas.
- Índices operativos.
- Transacciones en pago/pedido.
- No BLOBs.

## 7. Carrito

Persistencia en navegador, estructura versionada. El servidor reconstruye y valida identificadores/configuración; nunca confía en precio, descuento o envío enviados por cliente.

## 8. Stripe

Stripe Checkout alojado.

Seguridad: secret solo servidor, webhook secret por entorno, raw request, firma, idempotencia y no confiar en query params.

Flujo: validar → CheckoutAttempt → Session → redirect → webhook → transacción → pedido → email.

Reembolsos desde Stripe Dashboard; webhooks sincronizan estado.

## 9. SEUR Pickup

MVP solo busca, selecciona, valida y guarda snapshot de puntos. No crea expediciones ni etiquetas.

Arquitectura: Browser → Next.js → SEUR. Credenciales solo en env.

Aplicar timeout corto, fallback a domicilio, rate limit y reutilización de tokens/caché corta en memoria si aporta valor. Sin Redis.

## 10. Medios

Almacenamiento persistente Hostinger fuera de la carpeta de despliegue. Variable `MEDIA_ROOT`, no ruta absoluta hardcodeada. BBDD guarda `storageKey` relativa.

Beta y producción usan raíces distintas.

Uploads permitidos: JPG/JPEG, PNG y WebP. No SVG.

Al reemplazar, subir nuevo fichero y cambiar referencia; no sobrescribir.

## 11. Imágenes

Priorizar simplicidad: imágenes preparadas por administrador, recomendaciones de dimensiones/peso, `next/image` si funciona correctamente en hosting, responsive sizes y WebP/AVIF cuando sea viable. No pipeline pesada propia.

## 12. Auth

Auth.js.

Login: email → contraseña → TOTP → sesión.

Password Argon2id. Secreto TOTP cifrado. Recovery codes hasheados y de un uso. Sesión ~8 h, Secure, HTTP-only, SameSite apropiado y revocable.

No registro, forgot password por email, invitaciones ni roles complejos.

## 13. Seguridad

- Zod server-side.
- CSRF/origin adecuado.
- Rate limit login/2FA/checkout/Pickup.
- CSP.
- HSTS en producción.
- protección contra framing.
- Referrer-Policy.
- Permissions-Policy.
- minimización de PII.
- errores sin detalles técnicos.
- secrets solo env.

## 14. Email

SMTP Hostinger con host, port, user, password, from y reply-to en variables.

Guardar pedido antes de enviar. Si falla, `EmailDelivery=FAILED` y reintento desde admin. Sin cola externa.

## 15. Caché

Sin Redis. Usar caché/revalidación de Next.js para home, catálogo y producto. Invalidar al cambiar Drop/Product/DropProduct. Carrito, checkout, pedido privado y admin dinámicos/no públicos.

## 16. SEO técnico

Producto futuro indexable, sin filtrar precio ni Offer con precio. Activo con Product/Offer. Finalizado indexable y oferta no disponible. Sitemap solo producción pública. Slugs editables con redirect 301 automático.

## 17. Logs

Solo fichero técnico `warning/error` con retención limitada. No registrar cada visita. AuditLog, StripeEvent, EmailDelivery y OrderStatusHistory cubren trazabilidad operativa. No Sentry/Datadog/ELK.

## 18. Health

`/api/health` no sensible para comprobar aplicación y opcionalmente MySQL.

## 19. Entornos

Local: MySQL dev, Stripe test, media local.

Beta `tienda-beta.risingraimon.es`: BBDD propia, secrets propios, Stripe test, media propia, acceso protegido y noindex.

Producción `tienda.risingraimon.es`: BBDD propia, Stripe live, SMTP real, SEUR real y media propia.

Nunca compartir BBDD beta/prod.

## 20. Git y deploy

`beta` auto despliega beta. `main` auto despliega producción. Flujo recomendado `feature/* → beta → main`. Sin GitFlow complejo.

## 21. Migraciones

Para cambios relevantes: backup SQL → revisar/aplicar migración → desplegar → health → smoke tests. Evitar destructivas. El rollback de código no implica rollback de datos.

## 22. Backups

Hostinger como base. Copias adicionales antes de migraciones importantes, corte y cambios críticos. Respaldar MySQL y media. Objetivo de recuperación: horas.

## 23. Independencia deportiva

La compra debe funcionar aunque `risingraimon.es` esté caída. Solo se comparten marca y enlaces; no BBDD, sesión, API obligatoria ni filesystem.
