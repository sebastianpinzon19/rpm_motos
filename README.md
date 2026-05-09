# RMP Motos

Tienda de defensas y accesorios para motos.

Este repositorio contiene:
- Frontend: Vite + React + Tailwind
- Backend (desarrollo): Express + PostgreSQL (API local para admin y tienda)
- Panel admin para gestionar productos, imágenes y compatibilidad por modelo

Resumen rápido:
- Frontend build: `dist/` (Vite)
- API local: `server/index.cjs` (Express)

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
- `JWT_SECRET` (usar valor fuerte en producción)
- `ADMIN_API_KEY` (opcional)

3) Ejecutar en desarrollo

```bash
# API en http://localhost:8787
npm run server

# Frontend dev en http://localhost:5173
npm run dev

# o ambos juntos
npm run dev:full
```

4) Build de producción (frontend)

```bash
npm run build
```

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
4. (Opcional) Añade variables de entorno para producción en Vercel:
   - `VITE_API_BASE` → URL pública de tu API (si el backend está desplegado por separado).

Nota sobre el backend:
- El backend Express está pensado para desarrollo local. Para producción tienes 2 opciones:
  1. Desplegar el backend en un servicio dedicado (Render, Railway, Fly, Heroku) y fijar `VITE_API_BASE` en Vercel.
  2. Migrar el backend a funciones serverless (`/api/*`) para alojarlo en Vercel — puedo hacer esta migración si lo deseas.

---

## Configurar backend en producción (opción recomendada)

Recomendación rápida:
1. Desplegar PostgreSQL en un servicio gestionado (Supabase, Render Postgres, Railway).
2. Desplegar el servidor Node en Render/Heroku/Fly.
3. En Vercel, añade `VITE_API_BASE` apuntando a la URL del servidor.

Variables a establecer en tu host de backend:
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
- `JWT_SECRET` (obligatorio)
- `ADMIN_API_KEY` (opcional)

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
- `npm run server` — Levanta Express API local
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
