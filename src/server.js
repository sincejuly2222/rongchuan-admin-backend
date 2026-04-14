// Application bootstrap: verifies database connectivity, then starts the HTTP server.
const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/database');
const { logError } = require('./utils/errorLogger');

function installProcessErrorHandlers() {
  process.on('unhandledRejection', (reason) => {
    logError('未处理的 Promise 拒绝', reason);
  });

  process.on('uncaughtException', (error) => {
    logError('未捕获异常', error);
    process.exit(1);
  });
}

function listen(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`服务已启动，监听端口 ${port}`);
      resolve(server);
    });

    server.once('error', reject);
  });
}

async function startServer() {
  try {
    await testConnection();
    console.log('数据库连接成功。');
    await listen(env.port);
  } catch (error) {
    logError('服务启动失败', error, {
      port: env.port,
      nodeEnv: env.nodeEnv,
    });
    process.exit(1);
  }
}

installProcessErrorHandlers();
startServer();
