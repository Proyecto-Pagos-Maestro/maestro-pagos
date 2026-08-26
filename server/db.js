/**
 * ARCHIVO: server/db.js
 * -------------------------------------------------------------
 * PROPÓSITO:
 * Centraliza la conexión a la base de datos PostgreSQL alojada en Supabase.
 * También se encarga de crear las tablas automáticamente si no existen
 * cuando el servidor arranca.
 * 
 * LÓGICA PRINCIPAL:
 * - Se usa el paquete 'pg' para conectarse.
 * - initDb() ejecuta un "CREATE TABLE IF NOT EXISTS" masivo para asegurar
 *   que la base de datos siempre tenga la estructura correcta (grupos, 
 *   estudiantes, configuración y suscripciones push).
 */
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

export async function initDb() {
  let client;
  try {
    client = await pool.connect();
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

      -- Modificar tabla existente para agregar telefono
      ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

      -- Insertar config por defecto si no existe
      INSERT INTO configuracion (id, usuario, pin, umbral, dias_archivo_inactivos)
      VALUES ('default', 'Profesor', NULL, 30, 545)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("✅ Base de datos sincronizada");
  } catch (error) {
    console.error("❌ Error conectando/sincronizando la base de datos:", error.message);
    throw error;
  } finally {
    if (client) client.release();
  }
}
