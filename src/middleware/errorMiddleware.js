// Global error middleware: converts thrown errors into the project's standard error response format.
const { sendError } = require('../utils/response');
const { logError } = require('../utils/errorLogger');

function errorHandler(error, req, res, next) {
  logError('请求处理失败', error, {
    method: req.method,
    path: req.originalUrl,
  });

  if (res.headersSent) {
    return next(error);
  }

  return sendError(res, {
    statusCode: error.statusCode || 500,
    message: error.message || '服务器内部错误',
    errors: process.env.NODE_ENV === 'production' ? null : error.stack,
  });
}

module.exports = {
  errorHandler,
};
