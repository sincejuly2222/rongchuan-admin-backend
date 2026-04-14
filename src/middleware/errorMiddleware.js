// Global error middleware: converts thrown errors into the project's standard error response format.
const { sendError } = require('../utils/response');
const { logError } = require('../utils/errorLogger');

function mapOperationalError(error) {
  const code = error?.code;

  if (code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || code === 'PROTOCOL_CONNECTION_LOST') {
    return {
      statusCode: 503,
      message: '数据库连接不可用，请稍后重试或联系管理员检查数据库服务',
    };
  }

  if (code === 'ER_ACCESS_DENIED_ERROR') {
    return {
      statusCode: 503,
      message: '数据库认证失败，请联系管理员检查数据库账号配置',
    };
  }

  return {
    statusCode: error?.statusCode || 500,
    message: error?.message || '服务器内部错误',
  };
}

function errorHandler(error, req, res, next) {
  logError('请求处理失败', error, {
    method: req.method,
    path: req.originalUrl,
  });

  if (res.headersSent) {
    return next(error);
  }

  const normalizedError = mapOperationalError(error);

  return sendError(res, {
    statusCode: normalizedError.statusCode,
    message: normalizedError.message,
    errors: null,
  });
}

module.exports = {
  errorHandler,
};
