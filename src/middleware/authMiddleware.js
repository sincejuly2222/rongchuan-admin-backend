// Access-token middleware: protects routes by validating Bearer tokens and attaching the decoded user payload.
const { verifyAccessToken } = require('../utils/token');
const { sendError } = require('../utils/response');

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization || '';
  const bearerToken = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;
  const token = bearerToken;

  if (!token) {
    return sendError(res, {
      statusCode: 401,
      message: '缺少访问令牌',
    });
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }

    req.user = payload;
    return next();
  } catch (error) {
    return sendError(res, {
      statusCode: 401,
      message: '访问令牌无效或已过期',
    });
  }
}

module.exports = {
  authenticateToken,
};
