// Application bootstrap: verifies database connectivity, then starts the HTTP server.
const app = require('./app');
const env = require('./config/env');
const { ensureBlogTable, ensureProfileColumns, testConnection } = require('./config/database');

async function startServer() {
  try {
    await testConnection();
    console.log('数据库连接成功。');
    await ensureProfileColumns();
    await ensureBlogTable();
    console.log('用户资料字段检查完成。');

    app.listen(env.port, () => {
      console.log(`服务已启动，监听端口 ${env.port}`);
    });
  } catch (error) {
    console.error('服务启动失败：', error.message);
    process.exit(1);
  }
}

startServer();
