// Response helpers: keeps successful and failed API responses in a consistent JSON structure.
function sendSuccess(res, options = {}) {
  const {
    statusCode = 200,
    message = '成功',
    data = null,
  } = options;

  return res.status(statusCode).json({
    code: statusCode,
    message,
    data,
  });
}

function sendError(res, options = {}) {
  const {
    statusCode = 500,
    message = '服务器内部错误',
    errors = null,
    data = null,
  } = options;

  return res.status(statusCode).json({
    code: statusCode,
    message,
    data,
    errors,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
