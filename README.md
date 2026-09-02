# Rising Raimon Store Platform

Plataforma ecommerce independiente de Rising Raimon. Incluye catálogo por drops,
carrito invitado, Stripe Checkout, operación manual de pedidos, correos,
backoffice protegido, SEO y páginas legales estáticas.

## Requisitos

- Node.js 22 o superior.
- npm 10 o superior.
- MySQL 8 o MariaDB compatible.

## Ejecución local

1. Copia `.env.example` a `.env` y ajusta `DATABASE_URL`,
   `SHADOW_DATABASE_URL` y `MEDIA_ROOT`.
2. Crea dos bases vacías: una para la tienda y otra distinta para las migraciones
   de desarrollo.
3. Instala dependencias con `npm install`.
4. Aplica las migraciones con `npm run db:migrate:dev`.
5. Carga la configuración mínima con `npm run db:seed`.
6. Define un `AUTH_SECRET` aleatorio de al menos 32 caracteres.
7. Arranca con `npm run dev` y abre `http://localhost:3000`.

El health está en `GET /api/health`. Sin `DATABASE_URL`, la aplicación responde
correctamente e indica que la base no está configurada. Con la variable definida,
ejecuta una consulta mínima y responde `503` si MySQL no está accesible.

## Base de datos

```bash
npm run prisma:generate       # regenera el cliente
npm run prisma:validate       # valida el esquema
npm run db:migrate:dev        # crea/aplica migraciones en desarrollo
npm run db:migrate:deploy     # aplica migraciones existentes en un despliegue
npm run db:seed               # seed mínimo e idempotente
npm run db:verify             # verifica tablas, seed, relaciones y restricciones
npm run db:migrate:reset      # destruye y reconstruye la BBDD local
```

`SHADOW_DATABASE_URL` debe apuntar a una base diferente de `DATABASE_URL`. La
cuenta de MySQL necesita permisos para usar ambas en desarrollo. El comando de
reset elimina todos los datos y solo debe emplearse de forma consciente en local.

El seed crea únicamente `StoreSettings`, activa el envío `HOME` y conserva
`PICKUP` desactivado por compatibilidad histórica. No crea catálogo, pedidos,
cupones, tallas, drops ni datos de demostración.

### Catálogo local de demostración

Con `STORE_ENV=local` se puede cargar un catálogo idempotente para probar la
tienda sin mezclarlo con el seed estructural:

```bash
npm run demo:seed
npm run demo:clean
```

El primer comando crea tres drops (activo, próximo y finalizado), cuatro
productos —incluido un pack de tres componentes—, tallas, personalizaciones,
precios y seis cupones con reglas distintas. Al repetirlo actualiza los datos y
conserva las imágenes asignadas desde el administrador.

La limpieza solo reconoce los identificadores reservados del catálogo demo. Se
detiene si esos registros ya participan en pedidos, checkout o catálogo ajeno;
también elimina los medios usados exclusivamente por el demo. Las tallas
genéricas se conservan para poder reutilizarlas en el catálogo definitivo.

## Catálogo público

- `/` muestra el drop disponible o próximo y los drops anteriores.
- `/productos` agrupa el catálogo por drop.
- `/productos/[slug]` muestra galería, tallas, guía, personalizaciones,
  componentes y relacionados.
- Los precios y suplementos de un próximo drop no se envían a la interfaz.
- Los medios se sirven desde `MEDIA_ROOT` únicamente si están registrados en
  `MediaAsset` y son JPG, PNG o WebP.
- Los redirects de la tabla `Redirect` responden con un 301 real.
- El sitemap solo contiene URLs cuando `STORE_ENV=production`.

Las páginas públicas se revalidan cada minuto. El catálogo definitivo se gestiona
desde el backoffice; los datos de demostración nunca forman parte del seed oficial.

## Stripe test local

Configura `STRIPE_SECRET_KEY` con una clave `sk_test_...`. Para recibir eventos
locales, usa Stripe CLI y copia el secreto `whsec_...` mostrado a
`STRIPE_WEBHOOK_SECRET`:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

El endpoint procesa confirmaciones de Checkout y los eventos `refund.created`,
`refund.updated` y `refund.failed`. En beta y producción, configura esos eventos
en el webhook de Stripe además de los eventos de Checkout.

El checkout usa una sesión alojada de 30 minutos. El retorno del navegador no
crea el pedido: solo el webhook firmado puede confirmar el pago y generar un
único pedido. Para una compra test puede utilizarse la tarjeta `4242 4242 4242
4242`, fecha futura y cualquier CVC de tres cifras.

## Primer administrador

La creación inicial es un comando explícito y solo funciona mientras no exista
ningún administrador:

```powershell
$env:ADMIN_INITIAL_EMAIL = "admin@example.com"
$env:ADMIN_INITIAL_PASSWORD = "una-clave-larga-y-unica"
npm run admin:create
Remove-Item Env:ADMIN_INITIAL_EMAIL, Env:ADMIN_INITIAL_PASSWORD
```

La contraseña debe tener entre 12 y 128 caracteres, se guarda con Argon2id y nunca
se imprime. Después de crear la cuenta, elimina esas variables del entorno.

## Administración

El acceso está en `/admin/login`. El primer inicio muestra el secreto y el QR para
configurar una aplicación TOTP; tras validarlo se muestran una única vez ocho
códigos de recuperación. La sesión dura como máximo ocho horas y se invalida si
se desactiva la cuenta o cambia su `sessionVersion`.

Desde el panel se administran drops, productos, tallas, guías de tallas, medios,
cupones, pedidos, envíos manuales, configuración, correos y redirects. También
incluye duplicado, archivado, vista previa privada, precios y suplementos por drop,
exportación de fabricación y un registro de auditoría de solo lectura.

Las imágenes aceptadas son JPG, PNG y WebP no animados de hasta 8 MB, 8.000 px por
lado y 40 megapíxeles. El tipo se valida por el contenido del archivo; no se
permite SVG ni eliminar un medio que esté en uso.

## SEO, legales y accesibilidad

Las rutas legales son `/aviso-legal`, `/privacidad`, `/cookies`,
`/condiciones-de-compra`, `/envios` y `/cambios-y-devoluciones`. Sus textos deben
ser revisados por asesoría jurídica y fiscal antes de activar producción.

Producción publica canonical, Open Graph, JSON-LD, `robots.txt` y `sitemap.xml`.
Beta permanece bloqueada para buscadores. Para verificar el dominio mediante la
etiqueta HTML de Google Search Console, copia solo el token facilitado por Google
en `GOOGLE_SITE_VERIFICATION` y vuelve a desplegar. El alta de la propiedad y el
envío del sitemap se realizan manualmente durante el corte.

Los redirects de URLs relevantes de WooCommerce se administran desde
`/admin/configuracion`. Aceptan una URL antigua completa o una ruta interna y
siempre responden con 301; la aplicación evita bucles y aplana cadenas conocidas.

Las comprobaciones E2E cubren rutas públicas, noindex, overflow móvil y reglas
automatizables WCAG A/AA. Tras instalar dependencias por primera vez:

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

Las pruebas automáticas de accesibilidad no sustituyen la revisión manual con
teclado, lector de pantalla, zoom al 200 % y dispositivos reales.

## Comprobaciones

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run prisma:validate
npm run db:verify
npm run catalog:verify -- http://127.0.0.1:3000
npm run release:check -- --target=beta
npm run smoke -- https://tienda-beta.risingraimon.es --target=beta
```

`release:check` no muestra secretos y comprueba entorno, base de datos, catálogo,
administrador, medios, Stripe, SMTP y restos demo. `smoke` solo realiza peticiones
GET no destructivas. El procedimiento completo de lanzamiento y rollback está en
[`docs/11_preparacion_y_corte.md`](docs/11_preparacion_y_corte.md).

Para inventariar únicamente los datos del entorno conectado, sin exigir todavía
las credenciales live, puede usarse:

```bash
npm run release:check -- --target=production --data-only
```

Este modo sirve como diagnóstico y no sustituye el preflight completo.

## Variables de entorno

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `STORE_ENV` | Sí en deploy | `local`, `beta` o `production`. Beta y local no se indexan. |
| `SITE_URL` | Sí en deploy | Origen canónico del entorno. |
| `AUTH_SECRET` | Sí | Secreto aleatorio de 32 caracteres o más para sesiones y cifrado; distinto por entorno. |
| `DATABASE_URL` | Para BBDD | URL MySQL/MariaDB de la aplicación. |
| `DB_CONNECTION_LIMIT` | Opcional | Conexiones máximas del pool de Prisma por proceso (1–5; por defecto 2). |
| `DB_IP_DIAGNOSTIC` | Solo diagnóstico temporal | Con `true`, registra la IP pública de salida de Node.js al intentar un login admin válido. Debe volver a `false`. |
| `SHADOW_DATABASE_URL` | En migraciones dev | Base vacía y distinta usada por Prisma Migrate. |
| `MEDIA_ROOT` | Antes de medios | Directorio persistente externo al deploy. |
| `GOOGLE_SITE_VERIFICATION` | Opcional en producciÃ³n | Token HTML facilitado por Google Search Console. |
| `STRIPE_SECRET_KEY` | Para checkout | Clave secreta de Stripe; `sk_test_...` en local y beta. |
| `STRIPE_WEBHOOK_SECRET` | Para webhook | Secreto de firma del endpoint o Stripe CLI. |
| `SMTP_HOST` | Para correos | Servidor SMTP, normalmente `smtp.hostinger.com`. |
| `SMTP_PORT` | Para correos | Puerto SMTP; normalmente `465`. |
| `SMTP_SECURE` | Para correos | `true` para TLS directo en el puerto 465. |
| `SMTP_USER` | Para correos | Cuenta de correo remitente. |
| `SMTP_PASSWORD` | Para correos | Contraseña de la cuenta; solo en variables de entorno. |
| `SMTP_FROM_EMAIL` | Para correos | Dirección visible del remitente. |
| `SMTP_FROM_NAME` | Opcional | Nombre visible; si falta se usa el nombre configurado de la tienda. |
| `ADMIN_INITIAL_EMAIL` | Solo alta inicial | Email del primer administrador. |
| `ADMIN_INITIAL_PASSWORD` | Solo alta inicial | Contraseña temporal de entrada al comando de alta. |

No se guardan valores reales en Git. Local, beta y producción usan bases de datos,
secretos y raíces de medios distintas.

### Diagnóstico temporal de IP de salida

Si MySQL rechaza la conexión porque falta autorizar la IP pública de Node.js:

1. configura temporalmente `DB_IP_DIAGNOSTIC=true` en Hostinger y redespliega;
2. envía un único login admin con email y contraseña en formato válido;
3. busca en los logs `[node-egress-ip-diagnostic]` y el estado `IP_OK`;
4. añade `sourceIp` a la allowlist de MySQL y reintenta;
5. configura `DB_IP_DIAGNOSTIC=false` y vuelve a desplegar.

El diagnóstico tiene un timeout de tres segundos y nunca registra credenciales,
la URL de MySQL ni consultas. La IP obtenida es la salida HTTP pública observada
por el servicio externo; si el proveedor enruta MySQL por otra salida, debe
confirmarse con la información de conexión de Hostinger. El preflight bloquea el
lanzamiento mientras la variable siga activada.

## Beta

- Rama de despliegue: `beta`.
- `STORE_ENV=beta` y `SITE_URL=https://tienda-beta.risingraimon.es`.
- Base de datos y `MEDIA_ROOT` exclusivos de beta.
- La aplicación añade `noindex`, bloquea `robots.txt` y envía `X-Robots-Tag`.
- El acceso protegido del entorno se configura también en Hostinger.

## Producción

- Rama de despliegue: `main`.
- `STORE_ENV=production` y `SITE_URL=https://tienda.risingraimon.es`.
- Base de datos y `MEDIA_ROOT` exclusivos de producción.
- `npm run build` ejecuta automaticamente un hook `prebuild` en beta/produccion:
  aplica `npm run db:migrate:deploy`, ejecuta `npm run db:seed` y despues compila.
  Ambos pasos son idempotentes y garantizan la configuracion estructural y que
  Pickup siga desactivado. En local el hook no toca la base de datos.
- Después de las migraciones se ejecuta `npm run db:seed`; es idempotente y
  garantiza la configuración estructural y que Pickup siga desactivado.
- Comando de build: `npm ci && npm run build`.
- Comando de inicio: `npm run start`.
- Se comprueba `/api/health` después de cada despliegue.

Hostinger ejecuta la aplicación como proceso Node.js y conserva los medios fuera
del directorio sustituido en cada despliegue. SSL/CDN y backups se gestionan en
Hostinger. No existe dependencia de la API, sesión, base de datos o filesystem de
la web deportiva.

## Estructura

```text
src/app/             rutas públicas, admin y API
src/components/      componentes compartidos
src/features/catalog dominio y componentes del catálogo público
src/lib/             configuración transversal
src/server/db/       Prisma singleton y health de MySQL
src/styles/          tokens visuales de Rising Raimon
prisma/schema.prisma modelo relacional del MVP
prisma/migrations/   historial SQL versionado
prisma/seed.ts       configuración inicial idempotente
scripts/             alta inicial, verificaciones, preflight y smoke tests
```
