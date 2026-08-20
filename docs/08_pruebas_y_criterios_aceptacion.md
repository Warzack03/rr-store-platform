# Documento 8 — Pruebas y criterios de aceptación

## 1. Estrategia

Priorizar pruebas donde una regresión pueda provocar cobro incorrecto, pedido duplicado, personalización incorrecta, caída del checkout, fuga de información, envío a zona no soportada o pérdida de pedido. No perseguir cobertura porcentual artificial.

## 2. Unitarias

### Drops

- antes de inicio = próximo;
- dentro de fechas = disponible;
- después = finalizado;
- límites exactos;
- ventana de 30 minutos para checkout iniciado antes del cierre.

### Precios

- base;
- compare-at;
- nombre;
- dorsal;
- bundle;
- cantidad;
- cálculo en céntimos sin float.

### Personalización

- mayúsculas;
- tildes;
- espacios;
- longitud máxima;
- dorsal `00`;
- dorsal `99`;
- rechazo fuera de rango.

### Cupones

- fijo;
- porcentaje;
- drop específico;
- global;
- fechas;
- mínimo;
- límite;
- inactivo;
- un cupón;
- no stacking.

### Envío

- domicilio;
- Pickup;
- tarifa configurable;
- método desactivado;
- CP peninsular;
- rechazo de zonas excluidas.

## 3. Integración BBDD

- secuencia de pedido única;
- snapshots completos;
- bundles;
- componentes;
- personalizaciones;
- dirección;
- shipment;
- cambios posteriores de catálogo no alteran pedidos;
- archivado sin borrado histórico;
- auditoría.

## 4. Stripe

### Webhook

- firma correcta;
- firma incorrecta;
- evento duplicado;
- sesión inexistente;
- checkout expirado;
- pago confirmado;
- reembolso parcial;
- reembolso total.

### Idempotencia

Enviar el mismo evento varias veces y verificar que existe un único pedido.

### Retorno antes de webhook

La pantalla espera, no crea pedido falso y termina al llegar la confirmación.

### Pago cancelado

Conservar carrito/formulario razonablemente y permitir reintento.

## 5. SEUR

Con preproducción o mock:

- búsqueda válida;
- resultados;
- selección;
- revalidación;
- snapshot;
- timeout;
- error HTTP;
- respuesta vacía.

Ante fallo: mensaje humano y domicilio disponible.

## 6. Email

### Pedido recibido

Verificar destinatario, número, productos, personalizaciones, total, envío y token privado.

### Enviado

Con y sin tracking.

### Fallo SMTP

Pedido válido, `EmailDelivery=FAILED`, reintento y ausencia de duplicado.

## 7. E2E Playwright

Viewport prioritario móvil.

### Camiseta personalizada

Home → producto → talla → nombre → dorsal → carrito → cupón → checkout → domicilio → Stripe test → confirmación → pedido.

### Equipación completa

Talla camiseta distinta de pantalón, nombre y dorsales independientes.

### Pickup

Buscar, seleccionar, pagar y confirmar snapshot.

### Drop finalizado

Visible pero no comprable; carrito anterior invalidado.

### Admin

Login, TOTP, crear producto, drop, precio, publicar, ver pedido, fabricación, envío, tracking y entrega.

## 8. Seguridad

- contraseña incorrecta;
- TOTP incorrecto;
- rate limit;
- sesión expirada;
- ruta admin sin sesión;
- mutación no autorizada;
- CSRF/origin inválido;
- upload SVG/ejecutable/MIME falso/tamaño excesivo;
- manipulación de precio/descuento/envío/suplemento;
- token pedido incorrecto;
- no enumeración por número;
- logs sin secretos.

## 9. Accesibilidad

Objetivo WCAG 2.2 AA.

Revisar teclado, foco, formularios, errores, galería, modales, CTA fijo, contraste, targets, `prefers-reduced-motion` y screen reader en checkout.

Automatizar y complementar manualmente.

## 10. Responsive

Probar móvil pequeño, móvil habitual, tablet, desktop y zoom 200%. No aceptar overflow horizontal, CTA inaccesible, texto cortado, modal fuera de viewport o formularios imposibles.

## 11. SEO

- title;
- description;
- canonical;
- OG;
- sitemap;
- robots;
- Product;
- Offer solo cuando proceda;
- finalizados;
- 301;
- beta noindex;
- admin/pedidos privados no indexables.

## 12. Rendimiento

Objetivos Lighthouse orientativos en producción:

- Accessibility >= 95.
- Best Practices >= 95.
- SEO >= 95.
- Desktop Performance >= 90.
- Mobile Performance >= 80.

Core Web Vitals objetivo:

- LCP <= 2,5 s.
- CLS <= 0,1.
- INP <= 200 ms.

## 13. Backups y recuperación

Antes de producción realizar al menos una prueba real: backup MySQL, backup media, restauración controlada, arranque y comprobación de pedidos/productos. Objetivo de recuperación: horas.

## 14. Prueba real previa al lanzamiento

Con Stripe live e importe controlado: compra, webhook, email, pedido y conciliación. Si se usa como prueba, reembolso controlado.

## 15. Criterio de contenido

No aceptar pantallas con anotaciones de implementación, nombres de tablas, IDs técnicos, errores de API, placeholders de IA, Lorem ipsum o ayudas que describan cómo está programado.

## 16. Criterio global de salida

El MVP está listo cuando pasan compra completa, Stripe, SEUR/fallback, SMTP, validación legal, backup/restore, responsive, accesibilidad, SEO, performance razonable, beta aprobada y rollback documentado.
