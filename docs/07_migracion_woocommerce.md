# Documento 7 — Migración desde WooCommerce

## 1. Estrategia

La migración será deliberadamente manual y mínima. No se construirá un importador genérico porque el catálogo es pequeño, el nuevo modelo se basa en drops y no se necesitan cuentas ni históricos dentro de la nueva aplicación.

## 2. Datos que no se migran

- Clientes.
- Cuentas.
- Direcciones guardadas.
- Pedidos históricos.
- Cupones antiguos.
- Reseñas.
- Configuración de plugins.
- Stock WooCommerce.
- IDs internos.
- Configuración técnica de WordPress.

## 3. Datos que se recrean manualmente

Desde el nuevo backoffice:

- productos;
- tallas;
- personalizaciones;
- drops;
- precios;
- suplementos;
- guías de tallas;
- cupones nuevos.

## 4. Imágenes

Las fotografías que se quieran reutilizar se copiarán a la nueva biblioteca de medios.

Proceso:

1. identificar la fuente;
2. descargar/copiar un original válido;
3. revisar dimensiones y peso;
4. subirlo al nuevo backoffice;
5. guardarlo en almacenamiento persistente propio;
6. asociarlo al producto;
7. comprobar que no queda dependencia de `wp-content`.

No enlazar directamente a WordPress como solución definitiva.

## 5. URLs y SEO

Los slugs pueden cambiar.

Antes del corte:

1. inventariar URLs relevantes;
2. identificar su equivalente nuevo;
3. crear 301 cuando aporte valor;
4. comprobar respuesta y canonical;
5. evitar cadenas de redirecciones.

No es necesario conservar todas las URLs si no tienen equivalente útil.

## 6. Páginas legales

Revisar si WordPress contiene textos actuales. Si existen, usarlos solo como referencia y someterlos a validación profesional antes de producción.

## 7. WordPress como archivo histórico

Después del corte:

- no borrar inmediatamente;
- conservar BBDD y ficheros;
- impedir que siga funcionando como tienda pública;
- mantener acceso restringido para consulta histórica;
- decidir su retirada meses después.

## 8. Preparación de beta

En `tienda-beta.risingraimon.es`:

- crear catálogo manual;
- copiar imágenes;
- configurar drop;
- Stripe test;
- SMTP beta;
- Pickup;
- responsive;
- noindex;
- E2E.

## 9. Ensayo de corte

Realizar al menos un ensayo de backup, despliegue, migraciones, configuración, comprobación de dominio y smoke test. Registrar puntos manuales.

## 10. Corte final

### Paso 1 — Congelación

Acordar una ventana corta sin cambios de productos, precios o contenido WooCommerce.

### Paso 2 — Backup WooCommerce

Guardar BBDD, ficheros relevantes y configuración necesaria para rollback.

### Paso 3 — Backup nueva tienda

Guardar MySQL y media.

### Paso 4 — Validación

Comprobar productos, precios, drops, cupones, envíos, Stripe, email y SEUR.

### Paso 5 — Dominio

`tienda.risingraimon.es` pasa a la nueva aplicación.

### Paso 6 — Smoke tests

- home;
- producto;
- carrito;
- checkout;
- pago real controlado;
- webhook;
- pedido;
- email;
- admin;
- seguimiento.

### Paso 7 — SEO

- sitemap;
- robots;
- Search Console;
- 301;
- canonical;
- HTTPS.

## 11. Rollback

Si hay un fallo grave:

1. detener nuevas compras si hace falta;
2. identificar pedidos ya cobrados en la nueva tienda;
3. restaurar temporalmente WordPress en el dominio;
4. conservar la nueva BBDD;
5. solucionar;
6. repetir el corte.

No hacer rollback ciego si ya existen pagos reales.

## 12. Retirada definitiva de WordPress

Solo después de varios meses sin necesitar rollback, históricos resueltos, backups verificados y SEO estabilizado.

## 13. Modelo de importación

No crear `ImportBatch` ni `ImportBatchItem`.
