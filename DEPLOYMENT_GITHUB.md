# 📦 Guía para subir a GitHub y Vercel

El repositorio ya está inicializado y listo para subir. Los cambios están en el commit inicial.

## Opción 1: Subir a GitHub (Recomendado)

### Paso 1: Crear repositorio en GitHub

1. Ve a [github.com/new](https://github.com/new)
2. **Nombre del repositorio**: `rmp-motos` (o tu preferencia)
3. **Descripción**: "E-commerce platform for motorcycle accessories"
4. **Privacidad**: Public o Private (tu preferencia)
5. **NO inicialices** con README, .gitignore ni license (ya los tenemos)
6. Click en "Create repository"

### Paso 2: Conectar y subir

```bash
# Navegar al proyecto
cd "c:\Users\sebas\OneDrive\Desktop\programing\Nueva carpeta"

# Agregar el remote (reemplaza TU_USUARIO y rmp-motos)
git remote add origin https://github.com/TU_USUARIO/rmp-motos.git

# Cambiar rama a main (GitHub lo prefiere)
git branch -M main

# Subir al repositorio
git push -u origin main
```

**Resultado esperado:**
```
Enumerating objects: 49, done.
Counting objects: 100% (49/49), done.
...
✓ Branch 'main' set up to track 'origin/main'
```

---

## Opción 2: Despliegue en Vercel (Frontend solamente)

Una vez en GitHub:

### Paso 1: Conectar Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Conecta tu cuenta GitHub
3. Selecciona el repositorio `rmp-motos`
4. Click en "Import"

### Paso 2: Configurar el proyecto

**Build Settings** (debería estar auto-detectado):
- **Framework**: Vite
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`

**Environment Variables** (opcional para producción):
- `VITE_API_BASE`: `https://tu-api-backend.com` (si tienes backend desplegado)

Click en "Deploy"

**Resultado**: Tu frontend estará disponible en una URL tipo `rmp-motos.vercel.app`

---

## 🔧 Variables de entorno importantes

### Para desarrollo local (`.env`):
```
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=123456789
PGDATABASE=rmp_motos
JWT_SECRET=tu_secreto_fuerte_aqui
ADMIN_API_KEY=rmp-local-admin-key
```

### Para producción (configurar en Vercel Dashboard):
```
VITE_API_BASE=https://api.tudominio.com
```

---

## 📋 Estructura después del push

```
tu-usuario/rmp-motos
├── src/                    # Frontend React
├── server/                 # Backend Express
├── public/                 # Archivos estáticos
├── scripts/                # Utilidades (updateProductImages.cjs)
├── docs/                   # Documentación
├── package.json
├── vercel.json
├── README.md               # Centro de información
├── .env.example            # Template de variables
├── .gitignore
└── .git/                   # Historial de versionado
```

---

## ✅ Checklist final

- [x] Repositorio Git inicializado localmente
- [x] Commit inicial creado (49 archivos)
- [x] Build compila sin errores
- [ ] Repositorio subido a GitHub
- [ ] Vercel conectado al repositorio
- [ ] Frontend desplegado en Vercel
- [ ] Variables de entorno configuradas en Vercel (si es necesario)

---

## 🚀 Próximos pasos

1. **Backend en producción**:
   - Opción A: Servicio dedicado (Render, Railway, Fly, Heroku)
   - Opción B: Funciones serverless en Vercel (`/api/*`)

2. **Base de datos en producción**:
   - Supabase PostgreSQL (gratis + generoso)
   - PlanetScale (MySQL, muy bueno)
   - Render PostgreSQL (integrado con backend)

3. **Dominio personalizado**:
   - Conectar dominio en Vercel

---

## 📞 Ayuda

Si algo falla o necesitas ayuda con algún paso, hazme saber el error específico y te lo resuelvo. 👍
