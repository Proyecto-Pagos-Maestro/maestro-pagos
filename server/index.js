import express from 'express';
import cors from 'cors';
import webpush from 'web-push';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { pool, initDb } from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------------------------------
// CONFIGURACIÓN WEB PUSH
// -----------------------------------------------------
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    'mailto:test@example.com',
    publicVapidKey,
    privateVapidKey
  );
} else {
  console.warn("⚠️ Faltan las llaves VAPID. Ejecuta 'npx web-push generate-vapid-keys' y ponlas en el .env");
}

// -----------------------------------------------------
// RUTAS DE BASE DE DATOS (Sincronización)
// -----------------------------------------------------

// Obtener todos los datos
app.get('/api/datos', async (req, res) => {
  try {
    const configRes = await pool.query("SELECT * FROM configuracion WHERE id = 'default'");
    const gruposRes = await pool.query("SELECT * FROM grupos");
    const estudiantesRes = await pool.query("SELECT * FROM estudiantes");

    const conf = configRes.rows[0];
    const datos = {
      grupos: gruposRes.rows,
      estudiantes: estudiantesRes.rows.map(e => ({
        id: e.id,
        nombre: e.nombre,
        grupoId: e.grupo_id,
        pagos: e.pagos,
        notasPagos: e.notas_pagos,
        activo: e.activo,
        fechaInactivacion: e.fecha_inactivacion
      })),
      umbral: conf.umbral,
      pin: conf.pin,
      usuario: conf.usuario,
      diasArchivoInactivos: conf.dias_archivo_inactivos,
    };
    res.json(datos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo datos' });
  }
});

// Guardar/sincronizar datos completos (simplificado para que empate con localStorage)
app.post('/api/datos', async (req, res) => {
  const { grupos, estudiantes, umbral, pin, usuario, diasArchivoInactivos } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Config
    await client.query(
      `UPDATE configuracion SET usuario = $1, pin = $2, umbral = $3, dias_archivo_inactivos = $4 WHERE id = 'default'`,
      [usuario, pin, umbral, diasArchivoInactivos]
    );

    // Actualizar grupos (simplificado: borramos y reinsertamos o hacemos UPSERT)
    // Para SQLite/Postgres lo ideal es UPSERT. Usamos INSERT ON CONFLICT
    for (const g of grupos) {
      await client.query(
        `INSERT INTO grupos (id, nombre) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre`,
        [g.id, g.nombre]
      );
    }
    // Borrar grupos que ya no existen (requiere lógica extra, lo omitimos para mantenerlo simple ahora)

    // Actualizar estudiantes
    for (const e of estudiantes) {
      await client.query(
        `INSERT INTO estudiantes (id, nombre, grupo_id, pagos, notas_pagos, activo, fecha_inactivacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET 
           nombre = EXCLUDED.nombre,
           grupo_id = EXCLUDED.grupo_id,
           pagos = EXCLUDED.pagos,
           notas_pagos = EXCLUDED.notas_pagos,
           activo = EXCLUDED.activo,
           fecha_inactivacion = EXCLUDED.fecha_inactivacion`,
        [e.id, e.nombre, e.grupoId, JSON.stringify(e.pagos), JSON.stringify(e.notasPagos || {}), e.activo !== false, e.fechaInactivacion]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Error guardando datos' });
  } finally {
    client.release();
  }
});


// -----------------------------------------------------
// RUTAS DE NOTIFICACIONES PUSH
// -----------------------------------------------------

app.post('/api/subscribe', async (req, res) => {
  const subscription = req.body;
  try {
    await pool.query('INSERT INTO push_subscriptions (subscription) VALUES ($1)', [subscription]);
    res.status(201).json({});
  } catch (error) {
    console.error('Error guardando suscripción:', error);
    res.status(500).json({ error: 'Error de BD' });
  }
});

// Ruta de prueba para enviar notificación manual
app.post('/api/test-notification', async (req, res) => {
  try {
    const subs = await pool.query('SELECT subscription FROM push_subscriptions');
    const payload = JSON.stringify({ title: '¡Prueba Exitosa!', body: 'Las notificaciones Push están funcionando.' });
    
    for (const row of subs.rows) {
      await webpush.sendNotification(row.subscription, payload).catch(err => console.error(err));
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error enviando notificaciones' });
  }
});

// -----------------------------------------------------
// CRON JOB - RECORDATORIOS DE PAGO DIARIOS
// -----------------------------------------------------

cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Ejecutando revisión de pagos vencidos...');
  // Aquí irá la lógica para revisar días sin pagar 0, 1, y 2
  // En un paso posterior implementaremos esto con tu lógica frontend.
});

// -----------------------------------------------------
// START
// -----------------------------------------------------
const PORT = process.env.PORT || 3001;

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  });
}).catch(console.error);
