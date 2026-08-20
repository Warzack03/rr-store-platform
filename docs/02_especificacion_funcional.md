# Documento 2 — Especificación funcional

## 1. Catálogo

### Producto maestro

Un `Product` representa una prenda o diseño concreto de una temporada, por ejemplo `Camiseta primera equipación 26/27`. Si el diseño cambia en la temporada siguiente, se crea otro producto. El mismo producto puede venderse en varios drops mientras siga siendo físicamente el mismo artículo.

### Tipos de producto

`SIMPLE`: camiseta o pantalón.

`BUNDLE`: equipación completa formada por camiseta y pantalón. El bundle no gestiona stock en el MVP.

### Tallas

- Se crean desde backoffice.
- Son reutilizables y ordenables manualmente.
- Un producto define qué tallas admite.
- Esas tallas son las mismas en todos los drops del producto.
- No alteran el precio.
- La lista nunca debe estar hardcodeada.

Ejemplos actuales: `8`, `10`, `12`, `XS`, `S`, `M`, `L`, `XL`, `2XL`.

### Guía de tallas

Recurso reutilizable asociable a varios productos y accesible desde la ficha.

### Imágenes

Cada producto tiene imagen principal, secundarias, orden configurable y texto alternativo. Las imágenes se suben ya preparadas; no existe editor/cropper en el backoffice.

### Descripciones

- Nombre.
- Descripción corta.
- Descripción completa.

### Estados

- Borrador.
- Publicado.
- Archivado.

El estado del producto y el estado temporal del drop son conceptos distintos.

## 2. Drops

Un `Drop` agrupa una campaña temporal y tiene título, texto corto, hero, inicio, fin, estado administrativo, prioridad/principal y productos asociados.

### Estados públicos

Se calculan por fecha:

- Próximamente.
- Disponible.
- Finalizado.

No se requiere cron para cambiar estado.

### Antes de apertura

Se muestran nombre, imágenes, descripción, tallas, personalizaciones, guía y cuenta atrás. No se muestra precio ni se permite comprar.

### Activo

Se muestran precio, precio anterior opcional, suplementos, cuenta atrás y CTA.

### Finalizado

El producto conserva URL e indexación, muestra `Drop finalizado` y no se puede añadir al carrito.

### Cuenta atrás

- Más de 48 h: información por días.
- Últimas 48 h: horas/minutos más detallados.
- El servidor decide el cierre real.

## 3. Precio y personalización

El precio pertenece a `DropProduct` y tiene precio actual y precio anterior opcional. Todos los precios son finales con IVA incluido.

### Nombre

- Opcional.
- Solo camiseta.
- Suplemento configurable por drop.
- Longitud máxima configurable.
- Admite espacios y tildes.
- Se normaliza a mayúsculas.

### Dorsal

- Opcional.
- Camiseta y pantalón.
- Suplemento configurable por drop.
- Texto `00-99`.

### Equipación completa

Configuración independiente de camiseta y pantalón.

Camiseta: talla, nombre, dorsal.

Pantalón: talla, dorsal.

## 4. Stock

No existe control de stock en el MVP. El modelo es made-to-order: abrir drop, recibir pedidos, cerrar, fabricar, recibir y enviar.

No implementar stock por talla, reserva, stock de bundle, inventario ni movimientos.

## 5. Carrito

- Anónimo.
- Vive en navegador.
- Persiste entre recargas.
- No requiere BBDD.
- Configuraciones distintas son líneas distintas.
- Solo se agrupan cantidades si la configuración es idéntica.
- Permite aumentar/reducir, eliminar y editar.
- No mezcla drops.

El carrito no es fuente de verdad. El servidor recalcula producto, drop, disponibilidad, precio, suplementos, cupón, envío y total.

## 6. Cupones

MVP:

- porcentaje;
- fijo;
- código;
- activo/inactivo;
- drop específico opcional;
- global si no tiene drop;
- inicio/fin opcional;
- mínimo opcional;
- límite total opcional;
- usos realizados.

Reglas: uno por pedido, no acumulable, sin límite por cliente, sin reglas de volumen ni cupón de envío gratuito.

## 7. Checkout

Una sola página.

Orden:

1. contacto;
2. entrega;
3. dirección o Pickup;
4. resumen;
5. cupón;
6. observaciones opcionales;
7. aceptación legal;
8. pago.

Datos obligatorios: nombre, apellidos, email, teléfono.

No se pide por defecto cuenta, contraseña, DNI ni dirección de facturación separada.

Para factura personalizada se indica `risingraimon@gmail.com`.

Si falta una talla: `¿No encuentras tu talla? Escríbenos a risingraimon@gmail.com`.

## 8. Zonas y entrega

Solo España peninsular. País fijo España y validación server-side de CP. Rechazar Canarias, Baleares, Ceuta y Melilla con un mensaje humano.

### Domicilio

Tarifa inicial `4,99 €`, configurable.

Campos: CP, provincia, localidad, dirección, número y piso/puerta opcional.

### SEUR Pickup

Tarifa inicial `3,49 €`, configurable.

Flujo: elegir Pickup, buscar por CP/localidad, consultar SEUR server-side, mostrar lista, seleccionar, revalidar antes de Stripe y guardar snapshot.

Sin mapa embebido. Puede existir `Ver ubicación`.

Snapshot: id SEUR, nombre, dirección, CP, localidad y coordenadas si existen.

Si falla Pickup, informar y mantener domicilio disponible.

Ambos métodos pueden activarse/desactivarse desde configuración.

## 9. Stripe

Stripe Checkout alojado, con tarjeta y Apple Pay/Google Pay cuando proceda.

Flujo:

1. validar checkout;
2. crear `CheckoutAttempt`;
3. crear Stripe Session;
4. redirigir;
5. recibir webhook firmado;
6. procesar idempotentemente;
7. crear pedido;
8. asignar número;
9. enviar correos.

La URL de retorno nunca confirma por sí sola el pago.

Si el checkout se inicia antes del cierre del drop, puede completarse durante 30 minutos desde la creación del intento.

Pagos fallidos: sin pedido, sin número, sin email.

Reembolsos: desde Stripe Dashboard; la app recibe webhook y registra parciales/totales.

## 10. Pedidos

Numeración nueva desde `#1`.

Estado operativo:

- Recibido.
- En fabricación.
- Enviado.
- Entregado.
- Cancelado excepcionalmente.

Estado financiero separado:

- Pagado.
- Reembolsado parcialmente.
- Reembolsado.

### Fabricación

Al cerrar drop: exportar datos y acción en lote `Marcar como en fabricación`.

Exportación CSV/Excel con referencia, producto, cantidad, talla camiseta, nombre camiseta, dorsal camiseta, talla pantalón y dorsal pantalón. No incluir dirección, teléfono o email.

### Enviado

Uno a uno. Tracking y URL opcionales. Al marcar: guardar fecha y enviar email.

### Entregado

Se consulta SEUR manualmente y se marca a mano. No genera email adicional.

### Notas internas

El administrador puede añadir notas privadas.

## 11. Consulta del pedido

Ruta `/pedido/[token]` con token largo y aleatorio. Sin buscador público ni cuenta. No caduca automáticamente mientras se conserve el pedido.

Mostrar número, productos, personalización, importes, estado, entrega, Pickup si aplica, tracking, fechas y contacto de soporte. No destacar PII innecesaria.

## 12. Correos

Comprador:

- pedido recibido;
- pedido enviado;
- cancelación/reembolso si ocurre.

Administrador:

- aviso por pedido pagado.

SMTP Hostinger. Remitente dedicado del dominio, por ejemplo `tienda@risingraimon.es`. Soporte/Reply-To `risingraimon@gmail.com`.

Un fallo SMTP no invalida el pedido; se registra y permite `Reenviar correo`.

## 13. Fiscalidad

- Precios con IVA incluido.
- No pedir DNI por defecto.
- No dirección de facturación separada.
- No emitir factura fiscal propia en el MVP.
- La confirmación no se presenta como factura fiscal.
- Para factura personalizada: contacto por email.

Antes de producción la asesoría debe validar IVA, facturación, conservación documental e identificación cuando corresponda.

## 14. Cambios y devoluciones

La política debe validarse jurídicamente. La tienda debe soportar incidencias y reembolsos. No codificar como verdad absoluta que nunca existen devoluciones.

## 15. Páginas legales

Estáticas:

- Aviso legal.
- Privacidad.
- Cookies.
- Condiciones de compra.
- Envíos.
- Cambios y devoluciones.

Sin CMS.

## 16. Administración

### Dashboard

Drop actual/próximo, recibidos, en fabricación, enviados, importe del drop, últimos pedidos y accesos rápidos. Sin gráficas decorativas.

### Productos

Crear, editar, duplicar, archivar, imágenes, tallas, personalización, guía y componentes.

### Drops

Crear, editar, duplicar, fechas, hero, productos, precios, suplementos, vista previa, publicar y archivar. Un duplicado nace en borrador y exige nuevas fechas.

### Pedidos

Listado con número, fecha, cliente, importe, drop, estado y envío. Búsqueda por número/nombre/email. Filtros por drop/estado. Detalle con estado, productos, entrega, pago, cupón, notas, tracking e historial.

### Cupones

Gestión completa del alcance MVP.

### Medios

Biblioteca reutilizable, subida, alt y protección frente a borrado en uso.

### Configuración

Editable: tarifas, activar/desactivar métodos, email soporte, estimación de entrega, nombre de tienda y aviso global opcional.

No editable: secretos Stripe, SEUR, SMTP, TOTP o BBDD.

### Auditoría

Solo lectura. No borrable desde backoffice.
