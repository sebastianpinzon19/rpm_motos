CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  models JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES categories(id),
  compatible_brands JSONB NOT NULL DEFAULT '[]'::jsonb,
  compatible_models JSONB NOT NULL DEFAULT '[]'::jsonb,
  base_price INTEGER NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  images_by_model JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT NOT NULL DEFAULT '',
  customizable BOOLEAN NOT NULL DEFAULT FALSE,
  options JSONB
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
