# Documento 3 — Arquitectura de información y rutas

## 1. Principios

- Tienda y plataforma deportiva independientes.
- Sin dependencia de API/BBDD deportiva para comprar.
- Comparten marca y enlaces, no tablas.
- Navegación pública mínima.
- Sin página pública específica de drop en el MVP.
- `/productos` agrupa por drops.
- URLs privadas/admin fuera del sitemap.

## 2. Navegación pública

Cabecera: logo, Inicio, Productos, Carrito con contador y enlace a `risingraimon.es`.

En móvil debe ser minimalista; evitar hamburguesa si los elementos caben sin ruido.

## 3. Rutas públicas

### `/`

Home con estados drop activo, próximo o ninguno. Incluye hero, cuenta atrás, productos, históricos y vuelta al club.

### `/productos`

Listado agrupado por drops. Activo/próximo primero; históricos después. Sin categorías, filtros, buscador ni paginación compleja mientras el catálogo sea pequeño.

El hero puede enlazar a `/productos#drop-<identificador>`.

### `/productos/[slug]`

Ficha con producto, drop relevante, estado temporal, precio cuando proceda, imágenes, tallas, personalizaciones, bundle, guía y relacionados.

Cambio de slug publicado: 301 desde el anterior.

### `/carrito`

Carrito anónimo. No indexable.

### `/checkout`

Checkout de una página. No indexable.

### `/checkout/cancelado`

Opcional como estado de retorno de Stripe. Puede redirigir a checkout conservando carrito y mostrar `El pago no se ha completado. Puedes intentarlo de nuevo.`

### `/pedido/[token]`

Consulta privada, no indexable, token no predecible, sin sitemap ni buscador por número.

### Legales

- `/aviso-legal`
- `/privacidad`
- `/cookies`
- `/condiciones-de-compra`
- `/envios`
- `/cambios-y-devoluciones`

### 404

`No encontramos esta página` con Inicio, Productos y Volver a Rising Raimon.

## 4. Rutas administrativas

### Auth

- `/admin/login`
- `/admin/2fa`

No existe registro ni recuperación pública.

### Dashboard

- `/admin`

### Drops

- `/admin/drops`
- `/admin/drops/nuevo`
- `/admin/drops/[id]`
- vista previa mediante ruta o mecanismo equivalente.

### Productos

- `/admin/productos`
- `/admin/productos/nuevo`
- `/admin/productos/[id]`

### Pedidos

- `/admin/pedidos`
- `/admin/pedidos/[id]`

### Cupones

- `/admin/cupones`
- `/admin/cupones/nuevo`
- `/admin/cupones/[id]`

### Guías

- `/admin/guias-tallas`
- `/admin/guias-tallas/nueva`
- `/admin/guias-tallas/[id]`

### Medios

- `/admin/medios`

### Configuración

- `/admin/configuracion`

### Auditoría

- `/admin/auditoria`

No añadir rutas para funciones fuera del MVP.

## 5. Route Handlers / API

Priorizar Server Components y Server Actions para lógica interna. Crear HTTP endpoints solo cuando haya consumidor externo o necesidad clara.

### `POST /api/stripe/webhook`

- raw body;
- firma;
- idempotencia;
- pagos/reembolsos;
- creación de pedido.

### Checkout

Preferentemente Server Action. Si se necesita endpoint: `POST /api/checkout/session`.

Nunca aceptar precios como fuente de verdad.

### `GET /api/shipping/pickup`

- CP/localidad;
- rate limit;
- validación;
- credenciales server-side;
- consulta SEUR;
- respuesta mínima al navegador;
- timeout.

### `GET /api/health`

Respuesta no sensible. Puede comprobar proceso y MySQL. No devolver versiones, variables, rutas del sistema ni credenciales.

## 6. Redirecciones

`Redirect` cubre cambios de slug y URLs WooCommerce relevantes. Usar `301`. Evitar redirects sin equivalente útil.

## 7. Robots y sitemap

Producción: home, productos publicados y legales.

Excluir: carrito, checkout, pedido privado, admin y API.

Beta: `noindex`, protegida y sin sitemap orientado a buscadores.

## 8. Navegación entre aplicaciones

Tienda → `https://risingraimon.es`.

Web deportiva → `https://tienda.risingraimon.es`.

Sin compartir sesiones, tablas o APIs obligatorias.
