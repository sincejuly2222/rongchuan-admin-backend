// Refresh-session data access layer: persists, queries, and revokes refresh token sessions.
const { pool } = require('../config/database');

async function createSession({
  userId,
  sessionId,
  tokenHash,
  expiresAt,
  userAgent = null,
  ipAddress = null,
}) {
  const [result] = await pool.execute(
    `INSERT INTO auth_refresh_sessions
      (user_id, session_id, refresh_token_hash, user_agent, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, sessionId, tokenHash, userAgent, ipAddress, expiresAt]
  );

  return {
    id: result.insertId,
    userId,
    sessionId,
    tokenHash,
    expiresAt,
    userAgent,
    ipAddress,
  };
}

async function findActiveSession(sessionId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, session_id, refresh_token_hash, user_agent, ip_address, expires_at, revoked_at
     FROM auth_refresh_sessions
     WHERE session_id = ? AND revoked_at IS NULL
     LIMIT 1`,
    [sessionId]
  );

  return rows[0] || null;
}

async function revokeSession(sessionId) {
  await pool.execute(
    `UPDATE auth_refresh_sessions
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE session_id = ? AND revoked_at IS NULL`,
    [sessionId]
  );
}

module.exports = {
  createSession,
  findActiveSession,
  revokeSession,
};
