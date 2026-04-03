// Token utilities: signs and verifies JWTs, hashes refresh tokens, and builds auth response payloads.
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      type: 'access',
    },
    env.accessToken.secret,
    { expiresIn: env.accessToken.expiresIn }
  );
}

function signRefreshToken(user, sessionId) {
  return jwt.sign(
    {
      userId: user.id,
      sessionId,
      type: 'refresh',
    },
    env.refreshToken.secret,
    { expiresIn: env.refreshToken.expiresIn }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.accessToken.secret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshToken.secret);
}

function buildAccessTokenPayload(user) {
  return {
    accessToken: signAccessToken(user),
    tokenType: 'Bearer',
    expiresIn: env.accessToken.expiresInSeconds,
  };
}

module.exports = {
  buildAccessTokenPayload,
  hashToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
