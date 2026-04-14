// Database configuration: creates the MySQL connection pool and provides a startup connectivity check.
const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

async function testConnection() {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.ping();
  } catch (error) {
    const wrappedError = new Error('数据库连接检测失败', { cause: error });
    wrappedError.context = {
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      database: env.db.database,
      connectTimeout: 10000,
    };
    throw wrappedError;
  } finally {
    connection?.release();
  }
}

module.exports = {
  pool,
  testConnection,
};
