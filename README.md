# Rising Raimon Store Platform

Base técnica de la nueva tienda independiente de Rising Raimon. La Fase 1
incluye Next.js, TypeScript, Tailwind, Prisma/MySQL, validación de entorno,
sistema visual, shells público/admin, health y seguridad base. No incluye aún
modelo ecommerce ni lógica de catálogo, compra o administración.

## Requisitos

- Node.js 22 o superior.
- npm 10 o superior.
- MySQL 8 o MariaDB compatible para comprobar la conexión de Prisma.

## Ejecución local

1. Copia `.env.example` a `.env` y ajusta `DATABASE_URL` y `MEDIA_ROOT`.
2. Crea una base de datos local vacía para la tienda.
3. Instala dependencias con `npm install`.
4. Genera el cliente con `npm run prisma:generate`.
5. Arranca con `npm run dev` y abre `http://localhost:3000`.

El health está en `GET /api/health`. Sin `DATABASE_URL`, la aplicación responde
correctamente e indica que la base de datos no está configurada. Con la variable
definida, ejecuta una consulta mínima y responde `503` si MySQL no está accesible.

## Comprobaciones

```bash
npm run lint
npm run typecheck
npm run build
npm run prisma:validate
```

## Variables de entorno

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `STORE_ENV` | Sí en deploy | `local`, `beta` o `production`. Beta y local no se indexan. |
| `SITE_URL` | Sí en deploy | Origen canónico del entorno. |
| `DATABASE_URL` | Para BBDD | URL MySQL/MariaDB. Prisma usa un pool máximo de 5 conexiones. |
| `MEDIA_ROOT` | Antes de medios | Directorio persistente externo al deploy; nunca se hardcodea. |

No se deben guardar valores reales en Git. Beta y producción usan bases de datos,
secretos y raíces de medios distintas.

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
- Comando de build: `npm ci && npm run build`.
- Comando de inicio: `npm run start`.
- Comprobar `/api/health` después de cada despliegue.

Hostinger debe ejecutar la aplicación como proceso Node.js y conservar los medios
fuera del directorio que sustituye cada despliegue. SSL/CDN y backups se gestionan
en Hostinger. No existe dependencia de la API, sesión, base de datos o filesystem
de la web deportiva.

## Estructura

```text
src/app/             rutas públicas, admin y API
src/components/      componentes compartidos
src/features/        dominios que se implementarán por fases
src/lib/             configuración transversal
src/server/db/       Prisma singleton y health de MySQL
src/styles/          tokens visuales de Rising Raimon
prisma/              configuración del datasource; sin modelos en Fase 1
```

La siguiente fase será exclusivamente el modelo de datos Prisma, tras una nueva
instrucción y revisión de los documentos de especificación.
