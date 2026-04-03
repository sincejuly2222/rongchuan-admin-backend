// Health controller: validates that the API process and MySQL connection are both responsive.
const { pool } = require('../config/database');
const { sendSuccess } = require('../utils/response');

async function checkHealth(req, res, next) {
  try {
    await pool.query('SELECT 1');

    return sendSuccess(res, {
      message: '服务运行正常',
      data: {
        database: '已连接',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  checkHealth,
};
