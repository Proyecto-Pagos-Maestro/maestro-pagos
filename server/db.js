import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        id VARCHAR(50) PRIMARY KEY,
        usuario VARCHAR(100) NOT NULL,
        pin VARCHAR(50),
        umbral INTEGER DEFAULT 30,
        dias_archivo_inactivos INTEGER DEFAULT 545
      );

      CREATE TABLE IF NOT EXISTS grupos (
        id VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS estudiantes (
        id VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        grupo_id VARCHAR(50) REFERENCES grupos(id) ON DELETE SET NULL,
        pagos JSONB DEFAULT '[]',
        notas_pagos JSONB DEFAULT '{}',
        activo BOOLEAN DEFAULT true,
        fecha_inactivacion VARCHAR(20)
      );

      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        subscription JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Insertar config por defecto si no existe
      INSERT INTO configuracion (id, usuario, pin, umbral, dias_archivo_inactivos)
      VALUES ('default', 'Profesor', NULL, 30, 545)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("✅ Base de datos sincronizada");
  } finally {
    client.release();
  }
}
