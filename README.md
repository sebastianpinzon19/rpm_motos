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

En Vercel u otro hosting **solo estático** no existe `/api` en ese dominio: define `VITE_API_BASE` o despliega todo con `npm start` en un host Node.

---

## Despliegue en Vercel (Frontend estático)

He preparado el proyecto para que el frontend se despliegue automáticamente en Vercel:

- Archivo `vercel.json` configurado para servir `dist/` (output de `vite build`).
- Script `vercel-build` en `package.json` que ejecuta `npm run build`.

Pasos:
1. Subir el repo a GitHub/GitLab/Bitbucket.
2. Conectar el repo en Vercel y configurar el proyecto.
3. En Vercel > Settings > Build & Output, verifica:
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist`
4. **Obligatorio si el API no está en el mismo dominio:** en Vercel > Settings > Environment Variables añade `VITE_API_BASE` con la URL pública de tu backend (sin barra final), por ejemplo `https://tu-servicio.railway.app`. Sin esto, el front intenta `/api/...` en Vercel (no existe) y verás avisos de “sin conexión” o modo demo.
5. En el servidor Express, incluye la URL exacta de tu web en Vercel dentro de `ALLOWED_ORIGINS` (CORS); si no, el navegador bloqueará las respuestas aunque el API exista.

Nota sobre el backend:
- **Recomendado (mismo sitio):** `npm run build` y `npm start` en Render/Railway/etc.: la web y `/api` comparten dominio; no necesitas `VITE_API_BASE`.
- Si el front está solo en **Vercel estático** y el API en otro sitio: define `VITE_API_BASE` en Vercel y `ALLOWED_ORIGINS` en el API.
- Migrar el backend a funciones serverless (`/api/*`) en Vercel es otra opción (refactor aparte).

---

## Configurar backend en producción (opción recomendada)

Recomendación rápida:
1. Desplegar PostgreSQL en un servicio gestionado (Supabase, Render Postgres, Railway).
2. Desplegar Node con **Build:** `npm run build` y **Start:** `npm start` (misma app sirve `dist/` y la API).
3. Si en cambio el front sigue en Vercel y el API aparte: añade `VITE_API_BASE` en Vercel apuntando al servidor Node.

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
   - En producción (Vercel): considera usar Cloudinary o S3 para almacenamiento persistente

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
