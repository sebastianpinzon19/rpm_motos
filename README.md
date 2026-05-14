# RMP Motos

Tienda de defensas y accesorios para motos.

Este repositorio contiene:
- Frontend: Vite + React + Tailwind
- Backend (desarrollo): Express + PostgreSQL (API local para admin y tienda)
- Panel admin para gestionar productos, imágenes y compatibilidad por modelo

Resumen rápido:
- Frontend build: `dist/` (Vite)
- API: `server/index.cjs` (Express). Si existe `dist/`, **sirve la tienda y el admin en el mismo puerto** que `/api` (no hace falta `VITE_API_BASE`).

---

## Preparar y ejecutar localmente

Requisitos:
- Node.js 18+
- PostgreSQL corriendo localmente

1) Instalar dependencias

```bash
npm install
```

2) Configurar variables de entorno

Copia `.env.example` (si existe) a `.env` y ajusta las credenciales de PostgreSQL y secretos.

Variables importantes:
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
- `JWT_SECRET` (mínimo 32 caracteres; en `NODE_ENV=production` es obligatorio y no puede ser un valor de ejemplo)
- `ADMIN_API_KEY` (opcional en local; en producción mínimo 16 caracteres y distinto del valor de ejemplo)
- `ALLOWED_ORIGINS` (opcional en local; en producción al menos una URL del front, separadas por coma). Si el navegador usa el **mismo dominio** que el API (despliegue con `npm start`), el servidor también acepta ese origen automáticamente.
- `VITE_API_BASE` solo si el **HTML se sirve en un dominio distinto** al del API (p. ej. Vercel estático + API en otro host). Déjalo vacío en local (proxy de Vite) o en despliegue todo-en-uno.

3) Ejecutar en desarrollo

```bash
# API en http://localhost:8787
npm run server

# Frontend dev en http://localhost:5173
npm run dev

# o ambos juntos
npm run dev:full
```

4) Build y servir **tienda + API en el mismo puerto** (Render, Railway, Fly, VPS)

```bash
npm run build
npm start
```

Abre `http://localhost:8787` (o el `PORT` que definas): catálogo, rutas de React y `/api/*` van al mismo servidor. Admin: `/admin` o `/admin.html`.

5) Build de solo frontend (por ejemplo para subir `dist/` a un CDN sin Node)

```bash
npm run build
```

En Vercel u otro hosting **solo estático** no existe `/api` en ese dominio: usa **`API_PROXY_TARGET`** + `middleware.js`, o **`VITE_API_BASE`**, o despliega todo con `npm start` en un host Node.

---

## Despliegue en Vercel (https://rpm-motos.vercel.app)

Vercel ahora despliega **frontend + backend** desde este mismo repo:
- Frontend estático desde `dist/`.
- API Express como función Node en `api/index.cjs`.

### Qué hace este repo en Vercel

1. **`vercel.json`** publica `dist/` y enruta:
   - `/api/*` → `api/index.cjs`
   - `/products/*` → `api/index.cjs`
2. **`api/index.cjs`** reutiliza el backend Express de `server/index.cjs` en modo serverless.
3. **`middleware.js`** solo hace proxy externo cuando defines `API_PROXY_TARGET`; si no existe, deja pasar la petición al backend del mismo proyecto.

### Pasos obligatorios en Vercel

1. **Variables de entorno** (Settings → Environment Variables → Production):
   - Para backend en el mismo Vercel: define variables de `server/.env` (`PG*`, `JWT_SECRET`, `ADMIN_API_KEY`, `ALLOWED_ORIGINS`).
   - `API_PROXY_TARGET` es opcional (solo si quieres proxy a un backend externo).

2. **En el servidor Express** (Railway, etc.):
   - **`ALLOWED_ORIGINS`**: incluye `https://rpm-motos.vercel.app` (y preview si usas previews de Vercel).
   - El API debe estar accesible por HTTPS desde internet.

3. **Redeploy** en Vercel tras guardar variables (el build no inyecta `API_PROXY_TARGET` en el JS del front; el middleware lo lee en runtime).

### Si aún falla

- Comprueba en el navegador **Network** → `/api/store`: si falla, revisa variables `PG*`/`JWT_SECRET`/`ADMIN_API_KEY` en Vercel.
- Si ves **502**, Vercel no alcanza tu URL (mal escrita, API caída o firewall).
- Si el API responde **403** en admin, casi siempre es **CORS / origen**: revisa `ALLOWED_ORIGINS` en el backend.

### Alternativa sin proxy

- Definir **`VITE_API_BASE`** en Vercel (build) apuntando al API (el cliente llama directo al otro dominio) **y** CORS en el backend. El proxy anterior evita exponer dos dominios al usuario y evita `VITE_API_BASE`.

Nota sobre el backend:
- En Vercel este repo ya soporta backend en funciones (`/api/*`).
- Si quieres usar un backend externo, puedes mantener `API_PROXY_TARGET`.

---

## Configurar backend externo en producción (opcional)

Recomendación rápida:
1. Desplegar PostgreSQL en un servicio gestionado (Supabase, Render Postgres, Railway).
2. Desplegar Node con **Build:** `npm run build` y **Start:** `npm start` (misma app sirve `dist/` y la API).
3. Si el front sigue en Vercel y el API aparte: configura **`API_PROXY_TARGET`** en Vercel (middleware) o **`VITE_API_BASE`** en el build (cliente directo al API).

Variables a establecer en tu host de backend:
- `NODE_ENV=production`
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
- `JWT_SECRET` (obligatorio, mínimo 32 caracteres, no uses el valor de ejemplo)
- `ADMIN_API_KEY` (obligatorio en producción, mínimo 16 caracteres)
- `ALLOWED_ORIGINS` (obligatorio en producción: URLs del front, separadas por coma)

---

## Administración de imágenes

### Carga de imágenes desde el admin (NUEVO)

El panel admin ahora permite **subir imágenes directamente**:

1. **En la forma de "Add product"** o **"Edit product"**:
   - Campo de entrada de archivo debajo de "Imágenes principales"
   - Al seleccionar un archivo, se sube automáticamente a `/api/upload`
   - La imagen se guarda localmente en `public/products/` 
   - Se muestra un **preview de thumbnails** con opción de eliminar

2. **Endpoint de carga**: `POST /api/upload`
   - Requiere autenticación JWT (header `Authorization: Bearer <token>`)
   - Acepta archivos: JPEG, PNG, WebP, GIF (máximo 5MB)
   - Retorna: `{ success: true, url: "/products/[uuid].ext" }`

3. **Almacenamiento**:
   - Las imágenes se guardan en `public/products/` con nombre UUID
   - Sirven vía Express static middleware en `/products/[filename]`
   - En **Vercel** con `API_PROXY_TARGET`, `/products/*` se proxifica al mismo Node que el API.

### Workflow típico

1. Abre el admin (`http://localhost:5173/admin`)
2. Edita un producto o crea uno nuevo
3. Usa la entrada de archivo para subir imágenes
4. Las imágenes se añaden a la lista de "Imágenes principales"
5. También puedes usar el botón `Autocompletar imágenes` para demo URLs desde Unsplash

### Notas sobre imágenes

- El admin permite editar `images` (lista de URLs) y `imagesByModel` (JSON por modelo)
- Botón `Autocompletar imágenes` rellena URLs demo desde Unsplash Source para cada modelo compatible
- Para producción se recomienda:
  - Usar URLs fijas (descarga + almacenamiento CDN)
  - O integrar Cloudinary/S3 para carga persistente desde admin

---

## Scripts útiles

- `npm run dev` — Vite dev server
- `npm run server` — Solo API (sin servir `dist/`). Útil con `npm run dev` en paralelo.
- `npm start` — API y, si existe `dist/`, tienda + admin en el mismo `PORT`
- `npm run dev:full` — Ejecuta backend + frontend en paralelo
- `npm run build` — Build frontend (produce `dist/`)
- `npm run vercel-build` — Script pensado para Vercel (ejecuta `build`)

---

## Migración a Serverless en Vercel (opcional)

Si quieres que todo (frontend + API) se despliegue desde el mismo repo en Vercel, puedo migrar las rutas de `server/index.cjs` a funciones en `api/` (cada endpoint como `api/auth/login.js`, etc.). Esto requiere un trabajo de refactor y tests — dime si quieres que proceda.

---

Si te parece, ahora:
- Puedo convertir el backend a serverless en Vercel (responde `Serverless en Vercel`).
- O bien implemento subida de imágenes al admin y guardado en `public/` o Cloudinary (responde `Subida de imágenes`).

---

Gracias — dime qué prefieres que haga a continuación.
