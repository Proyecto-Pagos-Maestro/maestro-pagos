import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const directUrl = "postgresql://postgres:crisYjos2026@db.hxlyppryatxfhfjlaszv.supabase.co:5432/postgres";
const poolerUrl6543 = "postgresql://postgres.hxlyppryatxfhfjlaszv:crisYjos2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres";
const poolerUrl5432 = "postgresql://postgres.hxlyppryatxfhfjlaszv:crisYjos2026@aws-0-us-west-2.pooler.supabase.com:5432/postgres";

async function test(url, label) {
  console.log(`\nTesting ${label}...`);
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    console.log(`🎉 SUCCESS on ${label}!`);
    const res = await client.query('SELECT NOW()');
    console.log("Result:", res.rows[0]);
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    console.log(`  Failed: ${err.message}`);
    await pool.end();
    return false;
  }
}

const okDirect = await test(directUrl, "Direct Connection (db.hxlyppryatxfhfjlaszv.supabase.co:5432)");
if (!okDirect) {
  const ok6543 = await test(poolerUrl6543, "Pooler Port 6543");
  if (!ok6543) {
    await test(poolerUrl5432, "Pooler Port 5432");
  }
}
