// Application bootstrap: starts the HTTP server first, then initializes database connectivity in the background.
const app = require('./app');
const env = require('./config/env');
const { ensureBlogTable, ensureProfileColumns, testConnection } = require('./config/database');

async function initializeDatabase() {
  try {
    await testConnection();
    console.log('数据库连接成功。');
    await ensureProfileColumns();
    await ensureBlogTable();
    console.log('数据库初始化检查完成。');
  } catch (error) {
    console.error('数据库初始化失败：', error.message);
  }
}

function startServer() {
  app.listen(env.port, () => {
    console.log(`服务已启动，监听端口 ${env.port}`);
    void initializeDatabase();
  });
}

startServer();
