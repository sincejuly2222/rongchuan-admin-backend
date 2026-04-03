// Standalone database connectivity check: loads env vars, opens one MySQL connection, runs a simple query, and prints the result.
require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const startedAt = Date.now();

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rongchuan_admin',
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  try {
    const [rows] = await connection.execute('SELECT NOW() AS now_time, DATABASE() AS db_name');
    console.log({
      ok: true,
      durationMs: Date.now() - startedAt,
      result: rows[0],
    });
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error({
    ok: false,
    name: error.name,
    message: error.message,
    code: error.code,
    errno: error.errno,
    syscall: error.syscall,
    address: error.address,
    port: error.port,
  });
  process.exit(1);
});
