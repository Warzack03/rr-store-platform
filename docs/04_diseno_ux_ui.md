# Documento 4 — Diseño UX/UI

## 1. Principios

- Mobile-first real.
- Desktop amplía; no reinventa.
- Identidad Rising Raimon.
- Fondo navy oscuro, dorado/amarillo y blanco.
- Titulares deportivos/condensados.
- Paneles oscuros, alto contraste y componentes moderadamente rectos.
- Sin estética SaaS genérica.
- JavaScript mínimo.
- WCAG 2.2 AA.
- Todo texto visible debe ser final para comprador o administrador.

## 2. Regla de contenido

No mostrar `datos extraídos de BBDD`, `webhook recibido`, `foreign key`, `error 500`, `SEUR API 503`, IDs internos, explicaciones de implementación o anotaciones de IA.

Transformar a lenguaje útil:

- `Pago confirmado`.
- `No hemos podido cargar los puntos de recogida.`
- `Esta imagen se está utilizando en Camiseta 26/27.`
- `No hemos podido enviar el correo. Puedes reenviarlo.`

Los detalles técnicos quedan en logs.

## 3. Sistema de diseño

### Color

Tomar `risingraimon.es` como fuente de verdad. Crear tokens para navy principal/secundario, dorado, blanco, grises y estados funcionales de éxito/aviso/error/información.

### Tipografía

Reutilizar fuentes de marca si la licencia permite autohospedado. Titulares condensados/deportivos; texto e interfaz con máxima legibilidad.

### Botones

Primario sólido, alto contraste, altura táctil suficiente y foco visible. Secundario con borde/acento. Destructivo solo cuando exista una acción destructiva real.

### Formularios

- label visible;
- no depender de placeholder;
- errores asociados;
- tipos de teclado correctos;
- foco visible;
- autocompletado cuando proceda.

### Tarjetas

Imagen dominante, jerarquía clara, bordes moderados y sin exceso de sombras.

### Movimiento

Solo transiciones funcionales. Respetar `prefers-reduced-motion`. Sin parallax ni animaciones decorativas continuas.

## 4. Home

### Drop activo

Jerarquía:

1. hero;
2. título;
3. texto corto;
4. `Disponible hasta...`;
5. cuenta atrás;
6. CTA `Ver productos`;
7. grid de productos;
8. históricos;
9. acceso al club.

Los tres productos tienen la misma jerarquía.

### Próximo drop

Mostrar hero, `Próximo drop`, fecha, cuenta atrás y productos. Sin precio y sin compra.

### Sin drop

Mensaje recomendado: `Estamos preparando el próximo drop`.

Añadir imagen de marca, acceso a productos anteriores y vuelta al club. Nunca estados tipo `No hay datos`.

### Móvil

Hero dominante, texto corto, CTA ancho, tarjetas sencillas y navegación mínima.

### Desktop

Hero horizontal y grid de tres productos, con la misma jerarquía.

## 5. Tarjeta de producto

Mostrar imagen, nombre, estado y precio solo cuando el drop esté abierto. No mostrar descripción larga, todas las tallas ni formularios. Toda la tarjeta debe ser claramente interactiva.

## 6. Ficha de producto

Orden:

1. galería;
2. nombre;
3. estado/cuenta atrás;
4. precio;
5. descripción corta;
6. talla;
7. guía;
8. personalizaciones;
9. cantidad;
10. total;
11. CTA;
12. descripción completa;
13. relacionados.

### Galería

Móvil: swipe, imagen grande y ampliación a pantalla completa. Desktop: galería mayor sin efectos pesados.

### Tallas

Botones grandes, no select. Debajo: `Guía de tallas` y `¿No encuentras tu talla? Escríbenos a risingraimon@gmail.com`.

### Personalización

Camiseta: `Añadir nombre +X €` y `Añadir dorsal +X €`. El input aparece solo al activar.

Equipación: separar visualmente `Camiseta` y `Pantalón`, cada uno con sus selecciones.

### CTA móvil

Barra inferior fija discreta: `Total 31,97 € · Añadir al carrito`.

Si falta talla, botón deshabilitado y mensaje específico.

### Relacionados

`También en este drop`, mostrando los otros productos.

## 7. Carrito

Cada línea muestra miniatura, producto, talla, personalización, cantidad, precio y subtotal. Acciones `Editar`, `Eliminar` y controles `− / +`.

Cupón bajo `¿Tienes un código de descuento?`, cerrado inicialmente.

Resumen: subtotal, descuento si existe y `Envío: se calcula en el checkout`.

CTA: `Continuar con el pedido`.

Vacío: `Tu carrito está vacío` + `Ver productos`.

## 8. Checkout

Orden:

1. contacto;
2. entrega;
3. dirección/Pickup;
4. resumen;
5. cupón;
6. observaciones;
7. consentimiento;
8. pagar.

### Entrega

Mostrar las tarifas reales configuradas.

### Pickup

Buscador por CP/localidad, estado `Buscando puntos...`, lista con nombre, dirección, horario cuando exista, `Seleccionar` y `Ver ubicación` opcional.

Error: `No hemos podido cargar los puntos de recogida. Puedes intentarlo de nuevo o elegir envío a domicilio.`

### Consentimiento

`He leído y acepto las condiciones de compra y la política de privacidad.`

Sin consentimiento comercial.

### CTA móvil

`Total X € · Pagar` fijo y accesible.

### Errores

Junto al campo: `Introduce un email válido`, `Selecciona un punto de recogida`, `Actualmente solo realizamos envíos a Península`, `Este drop ya ha finalizado`.

## 9. Stripe y retorno

Antes de redirigir: `Preparando el pago...`.

Cancelación: `El pago no se ha completado. Puedes intentarlo de nuevo.`

Si se vuelve antes del webhook: `Estamos confirmando tu pago...`.

Si tarda: `Tu pago se está confirmando. Te enviaremos un email cuando el pedido esté listo.`

Nunca mostrar error falso.

## 10. Confirmación

Título `¡Pedido recibido!` con número, confirmación de email, resumen y estado. Sin upsell ni publicidad.

## 11. Seguimiento privado

Timeline `Pedido recibido → En fabricación → Enviado → Entregado` con fechas.

En fabricación: `Tu equipación está en proceso de fabricación. Te avisaremos por email cuando haya sido enviada.`

Enviado con tracking: CTA `Seguir envío`.

Sin tracking: `Tu pedido ha sido enviado. La entrega estimada es de 24-48 horas.`

Contacto: `¿Necesitas ayuda con tu pedido? risingraimon@gmail.com`.

## 12. Backoffice

### Navegación desktop

Sidebar: Inicio, Drops, Productos, Pedidos, Cupones, Guías de tallas, Medios, Configuración, Auditoría.

Móvil: navegación compacta.

### Dashboard

Drop actual/próximo, pedidos recibidos, en fabricación, enviados, importe del drop, últimos pedidos y accesos rápidos. Sin gráficas decorativas.

Vacío: `Todavía no hay ningún drop. Crea el primero para empezar a preparar la tienda.`

### Editor de drop

Secciones Información, Fechas, Hero, Productos y Estado. Acciones Guardar borrador, Vista previa, Publicar, Duplicar y Archivar.

### Editor de producto

Secciones Información, Imágenes, Tallas, Personalización, Guía y Componentes. Acciones Guardar, Duplicar y Archivar.

### Pedidos

Listado con #, fecha, cliente, importe, drop, estado y entrega. Búsqueda por número/nombre/email. Detalle con acción principal arriba, después productos, entrega, pago, cupón, notas e historial.

Al marcar `Enviado`, pedir tracking/URL opcionales.

### Medios

Biblioteca sencilla. Si una imagen está en uso, mostrar dónde de forma humana. No exponer errores de integridad.

## 13. Accesibilidad

- navegación completa por teclado;
- foco visible;
- contraste AA;
- labels reales;
- errores asociados;
- targets táctiles adecuados;
- alt;
- `aria-live` cuando proceda;
- no depender solo del color;
- safe areas para barras fijas;
- zoom 200% sin romper flujo.

## 14. Rendimiento visual

Evitar CLS reservando dimensiones de imágenes, usando fuentes autohospedadas y proporciones conocidas. Skeletons solo cuando aporten utilidad.
