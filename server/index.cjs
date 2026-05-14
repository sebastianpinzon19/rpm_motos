const fs = require('fs')
const path = require('path')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const dotenv = require('dotenv')
const { Pool, Client } = require('pg')
const seedData = require('./seedData.cjs')
const bcrypt = require('bcryptjs/promises')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const multer = require('multer')

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'

const parseAllowedOrigins = () => {
  const raw = String(process.env.ALLOWED_ORIGINS || '').trim()
  if (raw) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return ['http://localhost:5173', 'http://127.0.0.1:5173']
}

const assertProductionConfig = () => {
  if (!isProduction) return
  const errors = []
  const jwtSecretValue = String(process.env.JWT_SECRET || '').trim()
  const weakJwt = new Set(['CHANGE_THIS_TO_A_STRONG_SECRET', 'change_this_to_a_strong_secret'])
  if (jwtSecretValue.length < 32 || weakJwt.has(jwtSecretValue)) {
    errors.push('JWT_SECRET debe existir, tener al menos 32 caracteres y no ser un valor de ejemplo.')
  }
  if (!String(process.env.PGPASSWORD || '').trim()) {
    errors.push('PGPASSWORD es obligatorio en producción.')
  }
  const apiKey = String(process.env.ADMIN_API_KEY || '').trim()
  if (apiKey.length < 16 || apiKey === 'rmp-local-admin-key') {
    errors.push('ADMIN_API_KEY es obligatorio en producción (mínimo 16 caracteres, distinto del valor local de ejemplo).')
  }
  const origins = parseAllowedOrigins()
  if (origins.length === 0) {
    errors.push('ALLOWED_ORIGINS debe listar al menos un origen (URLs del front separadas por coma).')
  }
  if (errors.length) {
    console.error('[rmp-api] Configuración inválida en NODE_ENV=production:\n', errors.map((e) => `  - ${e}`).join('\n'))
    process.exit(1)
  }
}

assertProductionConfig()

const app = express()
const port = Number(process.env.PORT || 8787)
let pool
let startupPromise

const pgConfig = {
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '123456789',
  database: process.env.PGDATABASE || 'rmp_motos'
}

const allowedOrigins = parseAllowedOrigins()

/** Mismo host que el API (p. ej. todo servido por Express en un solo puerto). */
const sameHostAsRequest = (req, origin) => {
  try {
    const u = new URL(origin)
    const raw = (req.get('x-forwarded-host') || req.get('host') || '').trim()
    const hostname = raw.split(':')[0]
    return Boolean(hostname && u.hostname === hostname)
  } catch (_) {
    return false
  }
}

const adminKey = process.env.ADMIN_API_KEY || 'rmp-local-admin-key'
const jwtSecret = process.env.JWT_SECRET || 'CHANGE_THIS_TO_A_STRONG_SECRET'
const accessTokenExpiry = process.env.ACCESS_EXPIRES || '1h'
const refreshTokenExpirySeconds = Number(process.env.REFRESH_EXPIRES_SEC || 60 * 60 * 24 * 30) // 30 days

const parseNumber = (value, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const sanitizePhone = (phone) => String(phone || '').replace(/\D/g, '').slice(0, 15)

const cleanProduct = (product) => ({
  id: String(product.id || '').trim(),
  name: String(product.name || '').trim(),
  category: String(product.category || '').trim(),
  compatibleBrands: Array.isArray(product.compatibleBrands) ? product.compatibleBrands : [],
  compatibleModels: Array.isArray(product.compatibleModels) ? product.compatibleModels : [],
  basePrice: Math.max(0, Math.floor(parseNumber(product.basePrice, 0))),
  stock: Math.max(0, Math.floor(parseNumber(product.stock, 0))),
  active: Boolean(product.active),
  images: Array.isArray(product.images) ? product.images : [],
  imagesByModel: typeof product.imagesByModel === 'object' && product.imagesByModel !== null ? product.imagesByModel : {},
  description: String(product.description || '').trim(),
  customizable: Boolean(product.customizable),
  options: product.options || null
})

const sanitizeStore = (raw) => ({
  brands: (raw.brands || []).map(b => ({
    id: b.id,
    name: b.name,
    logo: b.logo,
    models: b.models || []
  })),
  categories: (raw.categories || []).map(c => ({ id: c.id, name: c.name, active: Boolean(c.active) })),
  products: (raw.products || []).map(cleanProduct),
  settings: {
    storeName: String(raw.settings?.storeName || seedData.settings.storeName),
    tagline: String(raw.settings?.tagline || seedData.settings.tagline),
    whatsappNumber: sanitizePhone(raw.settings?.whatsappNumber || seedData.settings.whatsappNumber)
  }
})

app.disable('x-powered-by')
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}))
app.use((req, res, next) => {
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      if (sameHostAsRequest(req, origin)) return callback(null, true)
      return callback(null, false)
    }
  })(req, res, next)
})
app.use(express.json({ limit: '100kb' }))
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false
}))

app.use(express.static(path.join(__dirname, '../public')))

// Configure multer for image uploads
const publicDir = path.join(__dirname, '../public')
const productsDir = path.join(publicDir, 'products')

// Ensure products directory exists
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productsDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${uuidv4()}${ext}`
    cb(null, name)
  }
})

const uploadFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Solo se permiten imágenes JPEG, PNG, WebP o GIF'))
  }
}

const upload = multer({
  storage,
  fileFilter: uploadFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
})

const requireAdmin = async (req, res, next) => {
  const origin = req.header('origin')
  if (origin && !allowedOrigins.includes(origin) && !sameHostAsRequest(req, origin)) {
    return res.status(403).json({ error: 'Origen no permitido' })
  }

  const auth = String(req.header('authorization') || '')
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' })
  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, jwtSecret)
    req.admin = { id: payload.sub, username: payload.username }
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

const ensureDatabaseExists = async () => {
  const maintenanceDb = process.env.PGMAINTDB || 'postgres'
  const safeDbName = String(pgConfig.database).replace(/[^a-zA-Z0-9_]/g, '')
  if (!safeDbName) throw new Error('PGDATABASE inválida')
  const adminClient = new Client({ ...pgConfig, database: maintenanceDb })
  await adminClient.connect()
  try {
    const exists = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [safeDbName])
    if (exists.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE "${safeDbName}"`)
    }
  } finally {
    await adminClient.end()
  }
}

const withClient = async (handler, res) => {
  try {
    await ensureDatabaseReady()
  } catch (error) {
    console.error('Unable to initialize database:', error)
    if (!res.headersSent) res.status(500).json({ error: 'Error al inicializar la base de datos' })
    return
  }

  let client
  try {
    client = await pool.connect()
    return await handler(client)
  } catch (error) {
    console.error(error)
    if (!res.headersSent) res.status(500).json({ error: 'Error interno del servidor' })
  } finally {
    if (client) client.release()
  }
}

const runMigrationsAndSeed = async (dbPool) => {
  const schemaPath = path.join(__dirname, 'schema.sql')
  const schemaSql = fs.readFileSync(schemaPath, 'utf8')

  const client = await dbPool.connect()
  try {
    await client.query('BEGIN')
    await client.query(schemaSql)

    const productsCount = await client.query('SELECT COUNT(*)::int AS count FROM products')
    if (productsCount.rows[0].count === 0) {
      for (const brand of seedData.brands) {
        await client.query(
          'INSERT INTO brands(id, name, logo, models) VALUES($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING',
          [brand.id, brand.name, brand.logo, JSON.stringify(brand.models)]
        )
      }

      for (const category of seedData.categories) {
        await client.query(
          'INSERT INTO categories(id, name, active) VALUES($1,$2,$3) ON CONFLICT (id) DO NOTHING',
          [category.id, category.name, category.active]
        )
      }

      for (const product of seedData.products) {
        await client.query(
          `INSERT INTO products(
            id, name, category, compatible_brands, compatible_models, base_price, stock, active,
            images, images_by_model, description, customizable, options
          ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          ON CONFLICT (id) DO NOTHING`,
          [
            product.id,
            product.name,
            product.category,
            JSON.stringify(product.compatibleBrands || []),
            JSON.stringify(product.compatibleModels || []),
            product.basePrice,
            product.stock,
            product.active,
            JSON.stringify(product.images || []),
            JSON.stringify(product.imagesByModel || {}),
            product.description || '',
            product.customizable,
            product.options ? JSON.stringify(product.options) : null
          ]
        )
      }

      const settingsEntries = Object.entries(seedData.settings)
      for (const [key, value] of settingsEntries) {
        if (key === 'adminPassword') continue // don't store plaintext in settings
        await client.query(
          'INSERT INTO settings(key, value) VALUES($1,$2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
          [key, String(value)]
        )
      }
    }

    // ensure admin user exists (hash password)
    const adminPass = seedData.settings?.adminPassword || 'rmp2024'
    const passwordHash = await bcrypt.hash(String(adminPass), 12)
    const adminId = uuidv4()
    await client.query(
      'INSERT INTO admin_users(id, username, password_hash) VALUES($1,$2,$3) ON CONFLICT (username) DO NOTHING',
      [adminId, 'admin', passwordHash]
    )

    if (process.env.NODE_ENV !== 'production') {
      const devHash = await bcrypt.hash(String(adminPass), 12)
      await client.query(
        'UPDATE admin_users SET password_hash = $1 WHERE username = $2',
        [devHash, 'admin']
      )
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

const ensureDatabaseReady = async () => {
  if (!startupPromise) {
    startupPromise = (async () => {
      await ensureDatabaseExists()
      const nextPool = new Pool(pgConfig)
      await runMigrationsAndSeed(nextPool)
      pool = nextPool
      return pool
    })()
    try {
      await startupPromise
    } catch (error) {
      startupPromise = undefined
      throw error
    }
  }
  await startupPromise
}

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' })

  await withClient(async (client) => {
    const row = await client.query('SELECT id, password_hash FROM admin_users WHERE username = $1', [username])
    if (row.rowCount === 0) return res.status(401).json({ error: 'Credenciales inválidas' })
    const user = row.rows[0]
    const ok = await bcrypt.compare(String(password), user.password_hash)
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' })

    const accessToken = jwt.sign({ username }, jwtSecret, { subject: user.id, expiresIn: accessTokenExpiry })
    const refreshToken = uuidv4()
    const expiresAt = new Date(Date.now() + refreshTokenExpirySeconds * 1000)
    await client.query('INSERT INTO refresh_tokens(token, user_id, expires_at) VALUES($1,$2,$3)', [refreshToken, user.id, expiresAt])

    res.json({ accessToken, refreshToken, expiresIn: accessTokenExpiry })
  }, res)
})

app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body || {}
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken es requerido' })
  await withClient(async (client) => {
    const row = await client.query('SELECT token, user_id, expires_at FROM refresh_tokens WHERE token = $1', [refreshToken])
    if (row.rowCount === 0) return res.status(401).json({ error: 'Token inválido' })
    const tokenRow = row.rows[0]
    if (new Date(tokenRow.expires_at) < new Date()) {
      await client.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken])
      return res.status(401).json({ error: 'Refresh token expirado' })
    }
    const userRow = await client.query('SELECT id, username FROM admin_users WHERE id = $1', [tokenRow.user_id])
    if (userRow.rowCount === 0) return res.status(401).json({ error: 'Usuario no encontrado' })
    const user = userRow.rows[0]
    const accessToken = jwt.sign({ username: user.username }, jwtSecret, { subject: user.id, expiresIn: accessTokenExpiry })
    res.json({ accessToken, expiresIn: accessTokenExpiry })
  }, res)
})

app.post('/api/auth/logout', requireAdmin, async (req, res) => {
  const { refreshToken } = req.body || {}
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken es requerido' })
  await withClient(async (client) => {
    await client.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken])
    res.json({ ok: true })
  }, res)
})

app.post('/api/auth/change-password', requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {}
  if (!currentPassword || !newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' })
  }

  await withClient(async (client) => {
    const adminId = req.admin?.id
    const userRow = await client.query('SELECT id, password_hash FROM admin_users WHERE id = $1', [adminId])
    if (userRow.rowCount === 0) return res.status(401).json({ error: 'Administrador no encontrado' })
    const user = userRow.rows[0]
    const ok = await bcrypt.compare(String(currentPassword), user.password_hash)
    if (!ok) return res.status(401).json({ error: 'Contraseña actual inválida' })

    const hash = await bcrypt.hash(String(newPassword), 12)
    await client.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [hash, adminId])
    await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [adminId])
    res.json({ ok: true })
  }, res)
})

// Upload image endpoint
app.post('/api/upload', requireAdmin, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se envió ningún archivo' })
  }

  const imageUrl = `/products/${req.file.filename}`
  res.json({ 
    success: true, 
    url: imageUrl,
    filename: req.file.filename
  })
})

const readStore = async (client) => {
  const [brandsRes, categoriesRes, productsRes, settingsRes] = await Promise.all([
    client.query('SELECT id, name, logo, models FROM brands ORDER BY name ASC'),
    client.query('SELECT id, name, active FROM categories ORDER BY name ASC'),
    client.query(`
      SELECT id, name, category, compatible_brands, compatible_models, base_price, stock, active,
             images, images_by_model, description, customizable, options
      FROM products
      ORDER BY name ASC
    `),
    client.query('SELECT key, value FROM settings')
  ])

  const settings = settingsRes.rows.reduce((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})

  return sanitizeStore({
    brands: brandsRes.rows.map(row => ({ ...row, models: row.models || [] })),
    categories: categoriesRes.rows,
    products: productsRes.rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      compatibleBrands: row.compatible_brands || [],
      compatibleModels: row.compatible_models || [],
      basePrice: row.base_price,
      stock: row.stock,
      active: row.active,
      images: row.images || [],
      imagesByModel: row.images_by_model || {},
      description: row.description,
      customizable: row.customizable,
      options: row.options
    })),
    settings
  })
}

app.get('/api/health', (_, res) => {
  res.json({ ok: true })
})

app.get('/api/store', async (_, res) => {
  await withClient(async (client) => {
    const data = await readStore(client)
    res.json(data)
  }, res)
})

app.patch('/api/products/:id', requireAdmin, async (req, res) => {
  const productId = String(req.params.id || '').trim()
  const payload = cleanProduct({ ...req.body, id: productId })
  if (!payload.id || !payload.name || !payload.category) {
    return res.status(400).json({ error: 'Datos de producto inválidos' })
  }

  await withClient(async (client) => {
    const result = await client.query(
      `UPDATE products
       SET name = $1, category = $2, compatible_brands = $3, compatible_models = $4,
           base_price = $5, stock = $6, active = $7, images = $8,
           images_by_model = $9, description = $10, customizable = $11, options = $12
       WHERE id = $13`,
      [
        payload.name,
        payload.category,
        JSON.stringify(payload.compatibleBrands),
        JSON.stringify(payload.compatibleModels),
        payload.basePrice,
        payload.stock,
        payload.active,
        JSON.stringify(payload.images),
        JSON.stringify(payload.imagesByModel),
        payload.description,
        payload.customizable,
        payload.options ? JSON.stringify(payload.options) : null,
        payload.id
      ]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }
    const data = await readStore(client)
    res.json(data)
  }, res)
})

app.patch('/api/products/:id/active', requireAdmin, async (req, res) => {
  const productId = String(req.params.id || '').trim()
  await withClient(async (client) => {
    const now = await client.query('SELECT active FROM products WHERE id = $1', [productId])
    if (now.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' })
    await client.query('UPDATE products SET active = $1 WHERE id = $2', [!now.rows[0].active, productId])
    const data = await readStore(client)
    res.json(data)
  }, res)
})

app.patch('/api/products/:id/stock', requireAdmin, async (req, res) => {
  const productId = String(req.params.id || '').trim()
  const stock = Math.max(0, Math.floor(parseNumber(req.body?.stock, 0)))
  await withClient(async (client) => {
    const result = await client.query('UPDATE products SET stock = $1 WHERE id = $2', [stock, productId])
    if (result.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' })
    const data = await readStore(client)
    res.json(data)
  }, res)
})

app.post('/api/products', requireAdmin, async (req, res) => {
  const payload = cleanProduct(req.body || {})
  if (!payload.id || !payload.name || !payload.category) {
    return res.status(400).json({ error: 'Datos de producto inválidos' })
  }
  await withClient(async (client) => {
    await client.query(
      `INSERT INTO products(
        id, name, category, compatible_brands, compatible_models, base_price,
        stock, active, images, images_by_model, description, customizable, options
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (id) DO NOTHING`,
      [
        payload.id,
        payload.name,
        payload.category,
        JSON.stringify(payload.compatibleBrands),
        JSON.stringify(payload.compatibleModels),
        payload.basePrice,
        payload.stock,
        payload.active,
        JSON.stringify(payload.images),
        JSON.stringify(payload.imagesByModel),
        payload.description,
        payload.customizable,
        payload.options ? JSON.stringify(payload.options) : null
      ]
    )
    const data = await readStore(client)
    res.status(201).json(data)
  }, res)
})

app.patch('/api/categories/:id/active', requireAdmin, async (req, res) => {
  const categoryId = String(req.params.id || '').trim()
  await withClient(async (client) => {
    const now = await client.query('SELECT active FROM categories WHERE id = $1', [categoryId])
    if (now.rowCount === 0) return res.status(404).json({ error: 'Categoría no encontrada' })
    await client.query('UPDATE categories SET active = $1 WHERE id = $2', [!now.rows[0].active, categoryId])
    const data = await readStore(client)
    res.json(data)
  }, res)
})

app.patch('/api/settings', requireAdmin, async (req, res) => {
  const allowed = ['whatsappNumber', 'storeName', 'tagline']
  const entries = Object.entries(req.body || {}).filter(([key]) => allowed.includes(key))
  if (entries.length === 0) return res.status(400).json({ error: 'Sin cambios válidos' })

  await withClient(async (client) => {
    for (const [key, value] of entries) {
      const safeValue = key === 'whatsappNumber' ? sanitizePhone(value) : String(value || '')
      await client.query(
        'INSERT INTO settings(key, value) VALUES($1,$2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
        [key, safeValue]
      )
    }
    const data = await readStore(client)
    res.json(data)
  }, res)
})

const distDir = path.join(__dirname, '../dist')

const attachSpaFromDist = () => {
  const indexHtml = path.join(distDir, 'index.html')
  if (!fs.existsSync(indexHtml)) {
    console.warn('[rmp] dist/ no encontrado. Ejecuta `npm run build` para servir la web y el admin desde este mismo puerto que la API.')
    return
  }
  app.use(express.static(distDir))
  const sendAdmin = (_req, res) => res.sendFile(path.join(distDir, 'admin.html'))
  app.get(['/admin', '/admin/'], sendAdmin)
  app.get('/admin.html', sendAdmin)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    const ext = path.extname(req.path)
    if (ext && ext !== '.html') return next()
    res.sendFile(indexHtml, (err) => (err ? next(err) : undefined))
  })
}

attachSpaFromDist()

if (process.env.VERCEL) {
  module.exports = app
} else {
  ensureDatabaseReady()
  .then(() => {
    app.listen(port, () => {
      const hasSpa = fs.existsSync(path.join(distDir, 'index.html'))
      console.log(`RMP API + ${hasSpa ? 'web (dist/)' : 'solo API'} → http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Unable to start API:', error)
    process.exit(1)
  })
}
