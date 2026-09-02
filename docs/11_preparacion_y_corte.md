# Documento 11 — Preparación, corte y rollback

## 1. Alcance

Este runbook completa la Fase 11 sin introducir funcionalidad nueva. El corte solo
se autoriza cuando beta está validada, los bloqueos automáticos son cero y existe
evidencia de las comprobaciones manuales.

Nunca guardar aquí claves, contraseñas, tokens, copias SQL ni datos personales.

## 2. Estado automatizado

La aplicación incluye dos comandos de lanzamiento:

```bash
npm run release:check -- --target=beta
npm run release:check -- --target=production
npm run release:check -- --target=production --data-only
npm run smoke -- https://tienda-beta.risingraimon.es --target=beta
npm run smoke -- https://tienda.risingraimon.es --target=production
```

`release:check` valida sin imprimir valores sensibles. La opción `--data-only`
permite inventariar el catálogo conectado antes de disponer de los secrets live,
pero no sustituye la comprobación completa. Se valida:

- entorno, dominio canónico y HTTPS;
- base de datos exclusiva del entorno y raíz persistente de medios;
- modo Stripe y secreto del webhook;
- SMTP y Search Console;
- administrador con TOTP y recuperación;
- catálogo, imágenes, drops y ficheros de medios;
- ausencia de datos demo;
- entrega a domicilio activa y Pickup desactivado;
- eventos Stripe fallidos y avisos operativos.

`smoke` solo hace peticiones GET: health, páginas públicas, legales, canonical,
cabeceras, robots, sitemap y protección del backoffice. Si beta tiene Basic Auth,
las credenciales pueden pasarse temporalmente mediante `SMOKE_BASIC_AUTH_USER` y
`SMOKE_BASIC_AUTH_PASSWORD`; se retiran al terminar.

## 3. Lista de preparación

Cada punto debe quedar con fecha, persona y ubicación de la evidencia fuera del
repositorio.

| Área | Condición de salida | Estado inicial |
| --- | --- | --- |
| Catálogo | Productos, tallas, textos, precios, personalizaciones y drops definitivos revisados | Pendiente de contenido |
| Imágenes | Originales definitivos subidos; alt, orden, peso y recorte revisados en móvil/desktop | Pendiente de contenido |
| Legal/fiscal | Textos y operativa validados por profesional | Pendiente externo |
| Producción | BBDD, usuario, `MEDIA_ROOT` y variables exclusivos creados en Hostinger | Pendiente externo |
| Admin | Cuenta definitiva creada con el `AUTH_SECRET` de producción; TOTP y recovery codes custodiados | Pendiente externo |
| Stripe | Clave live, webhook live y eventos exactos configurados | Pendiente externo |
| SMTP | Buzón del dominio, SPF/DKIM y envío/recepción real verificados | Pendiente externo |
| SEUR Pro | Alta manual, etiqueta, tracking y gestión de incidencia ensayados | Pendiente externo |
| Backup | MySQL y media respaldados; restauración completa probada en destino aislado | Pendiente externo |
| WooCommerce | URLs inventariadas, 301 creados, congelación acordada y backup guardado | Pendiente externo |
| SEO | Search Console verificada y sitemap preparado | Pendiente externo |
| Calidad | Tests, responsive, accesibilidad manual, rendimiento y smoke aprobados | Pendiente de validación |

## 4. Preparación de beta

1. Crear en Hostinger una base y un usuario exclusivos de beta.
2. Crear un directorio persistente de medios fuera del directorio sustituido por
   los despliegues y conceder lectura/escritura al proceso Node.js.
3. Configurar `STORE_ENV=beta`, el dominio beta, un `AUTH_SECRET` exclusivo,
   MySQL beta, `MEDIA_ROOT` beta, Stripe test y SMTP de prueba.
4. Desplegar la rama `beta` y ejecutar:

   ```bash
   npm run db:migrate:deploy
   npm run db:seed
   npm run release:check -- --target=beta
   ```

5. Crear el administrador definitivo de beta, completar TOTP y retirar del entorno
   `ADMIN_INITIAL_EMAIL` y `ADMIN_INITIAL_PASSWORD`.
6. Crear desde el panel el catálogo definitivo y subir las imágenes definitivas.
7. Registrar en `/admin/configuracion` cada URL antigua que necesite un 301, sin
   cadenas ni destinos externos.
8. Ejecutar la compra E2E en Stripe test, el flujo de fabricación, el envío manual,
   tracking, entrega y reembolso.
9. Ejecutar smoke, teclado, zoom 200 %, lector de pantalla, móvil real y Lighthouse.

Beta debe conservar `noindex`, `robots.txt` bloqueado y acceso restringido hasta
el corte.

## 5. Variables de producción

Configurar en Hostinger, nunca en Git:

- `STORE_ENV=production`;
- `SITE_URL=https://tienda.risingraimon.es`;
- `AUTH_SECRET` aleatorio y exclusivo, de al menos 32 caracteres;
- `DATABASE_URL` de producción;
- `MEDIA_ROOT` absoluto, persistente y distinto de beta;
- `STRIPE_SECRET_KEY=sk_live_…`;
- `STRIPE_WEBHOOK_SECRET=whsec_…` del endpoint live;
- SMTP completo del buzón del dominio;
- `GOOGLE_SITE_VERIFICATION`.

No configurar `SHADOW_DATABASE_URL` ni conservar las variables temporales de alta
del administrador. Cambiar `AUTH_SECRET` después de activar TOTP invalida las
sesiones y hace ilegible el secreto TOTP cifrado; su custodia forma parte del
backup de configuración.

Si MySQL exige autorizar la IP pública de salida de Node.js, activar únicamente
durante el diagnóstico `DB_IP_DIAGNOSTIC=true`, redesplegar y enviar un login admin
con formato válido. El log `[node-egress-ip-diagnostic]` muestra `sourceIp` cuando
la consulta tiene éxito. Tras actualizar la allowlist, volver a `false` y
redesplegar. El preflight no permite abrir producción con el diagnóstico activo.

## 6. Stripe live controlado

En Stripe Dashboard, modo live:

1. crear el endpoint `https://tienda.risingraimon.es/api/stripe/webhook`;
2. suscribir exactamente:
   - `checkout.session.completed`;
   - `checkout.session.async_payment_succeeded`;
   - `checkout.session.expired`;
   - `refund.created`;
   - `refund.updated`;
   - `refund.failed`;
3. copiar el secreto de firma del endpoint al entorno de producción;
4. hacer una compra real de importe controlado;
5. verificar un solo cobro, un solo pedido, webhook procesado, email de comprador
   y aviso de administrador;
6. ejecutar un reembolso controlado desde Stripe y comprobar su sincronización.

La vuelta del navegador nunca sustituye al webhook. Si el webhook falla, no se
abre la venta hasta resolverlo.

## 7. SMTP y SEUR Pro

SMTP:

1. validar SPF y DKIM del dominio;
2. enviar confirmación de pedido, enviado y reembolso a una cuenta externa;
3. comprobar remitente, Reply-To, enlaces, spam y visualización móvil;
4. provocar en beta un fallo controlado y comprobar reenvío desde admin.

SEUR Pro, sin API ni Pickup:

1. copiar manualmente los datos de un pedido de prueba a SEUR Pro;
2. generar etiqueta/expedición;
3. guardar tracking y URL en la tienda, marcar enviado y verificar el email;
4. consultar SEUR Pro y marcar entregado manualmente;
5. ensayar una incidencia de entrega fallida: el comprador escribe al soporte y
   el administrador la gestiona fuera de la aplicación.

## 8. Backup y restauración

Antes del ensayo y del corte:

1. generar desde Hostinger un backup de MySQL de la nueva tienda;
2. copiar íntegramente `MEDIA_ROOT` preservando rutas relativas;
3. exportar y custodiar las variables de entorno mediante un medio seguro;
4. guardar backup de la BBDD y ficheros de WordPress/WooCommerce;
5. registrar hora, tamaño y ubicación de cada copia.

La restauración se prueba en una base y una raíz de medios aisladas, nunca encima
de producción:

1. restaurar MySQL en el destino de prueba;
2. restaurar los medios en otra ruta;
3. desplegar el mismo commit con variables del destino aislado;
4. ejecutar migraciones, `release:check`, health y smoke;
5. abrir producto, pedido privado de prueba y medio; verificar relaciones y
   cantidades de pedidos/productos;
6. registrar tiempo de recuperación y eliminar el entorno aislado solo después de
   conservar la evidencia.

No se considera válido un backup que nunca se ha restaurado.

## 9. Secuencia del corte

1. Acordar una ventana sin cambios y congelar catálogo/precios de WooCommerce.
2. Confirmar cero bloqueos en beta y producción con `release:check`.
3. Tomar backups finales de WooCommerce, MySQL nueva, media y configuración.
4. Anotar el commit desplegado y el valor DNS anterior para rollback.
5. Cuando haya cambios de esquema, ejecutar manualmente las migraciones y el
   seed en producción; arrancar y comprobar health. El comando normal de
   Hostinger puede ser únicamente `npm run build`.
6. Ejecutar la compra live controlada y su reembolso si todavía no se hizo.
7. Cambiar `tienda.risingraimon.es` a la nueva aplicación y verificar SSL.
8. Ejecutar `smoke` de producción y el flujo manual de comprador/admin.
9. Verificar 301, canonical, robots y sitemap; dar de alta el sitemap en Search Console.
10. Restringir WordPress para impedir nuevas compras, conservándolo como archivo.
11. Vigilar Stripe, pedidos y correo durante la ventana acordada.

## 10. Criterios de rollback

Rollback si ocurre cualquiera de estos casos y no puede corregirse durante la
ventana: checkout indisponible, webhook sin generar pedido, cobro duplicado,
pedidos incompletos, pérdida de medios, login admin inaccesible, base inestable o
SMTP incapaz de confirmar pedidos.

Procedimiento:

1. detener nuevas compras en la nueva tienda;
2. identificar y conciliar todos los pagos/pedidos recibidos desde el corte;
3. restaurar el DNS anterior o la configuración previa de WooCommerce;
4. mantener intactas la BBDD y los medios de la nueva tienda;
5. informar y resolver manualmente pedidos afectados;
6. corregir, repetir backup/preflight/smoke y acordar otro corte.

Nunca hacer rollback ciego después de recibir pagos. WordPress no se elimina:
permanece restringido y respaldado durante varios meses, hasta que pedidos, SEO y
plazo de rollback estén cerrados.

## 11. Evidencia final

Antes de declarar terminada la fase deben quedar registrados:

- fecha/hora de corte, commit y responsables;
- preflight y smoke sin fallos;
- identificador del backup y de la restauración probada;
- identificadores de pago, evento webhook, pedido y reembolso controlados;
- evidencia de SMTP, SEUR, responsive, accesibilidad y rendimiento;
- captura de Search Console y sitemap aceptado;
- ubicación del archivo WordPress y procedimiento para acceder a él;
- decisión explícita de mantener o cerrar la ventana de rollback.
