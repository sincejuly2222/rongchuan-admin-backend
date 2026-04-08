const alumniExchangeModel = require('../models/alumniExchangeModel');
const alumniUserModel = require('../models/alumniUserModel');
const { sendSuccess, sendError } = require('../utils/response');

function parseOptionalInteger(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = Number(value);
  return Number.isInteger(normalized) ? normalized : null;
}

function parseExchangeStatus(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = Number(value);
  if (![0, 1, 2].includes(normalized)) {
    return null;
  }

  return normalized;
}

function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
}

async function listExchanges(req, res, next) {
  try {
    const current = Number(req.query.current || req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const status = parseOptionalInteger(req.query.status);
    const fromUserId = parseOptionalInteger(req.query.fromUserId);
    const toUserId = parseOptionalInteger(req.query.toUserId);

    if (!Number.isFinite(current) || current < 1 || !Number.isFinite(pageSize) || pageSize < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '分页参数不正确',
      });
    }

    if ([status, fromUserId, toUserId].includes(null)) {
      return sendError(res, {
        statusCode: 400,
        message: '筛选参数不正确',
      });
    }

    const result = await alumniExchangeModel.listExchanges({
      current,
      pageSize,
      status,
      fromUserId,
      toUserId,
    });

    return sendSuccess(res, {
      message: '获取名片交换记录成功',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function createExchange(req, res, next) {
  try {
    const fromUserId = Number(req.body.fromUserId);
    const toUserId = Number(req.body.toUserId);
    const status = parseExchangeStatus(req.body.status, 0);
    const message = normalizeOptionalString(req.body.message);

    if (!Number.isFinite(fromUserId) || fromUserId < 1 || !Number.isFinite(toUserId) || toUserId < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '交换用户参数不正确',
      });
    }

    if (fromUserId === toUserId) {
      return sendError(res, {
        statusCode: 400,
        message: '不能和自己交换名片',
      });
    }

    if (status === null) {
      return sendError(res, {
        statusCode: 400,
        message: '交换状态参数不正确',
      });
    }

    const [fromUser, toUser] = await Promise.all([
      alumniUserModel.findById(fromUserId),
      alumniUserModel.findById(toUserId),
    ]);

    if (!fromUser || !toUser) {
      return sendError(res, {
        statusCode: 404,
        message: '交换用户不存在',
      });
    }

    const existingExchange = await alumniExchangeModel.findByPair(fromUserId, toUserId);
    if (existingExchange) {
      return sendError(res, {
        statusCode: 409,
        message: '该交换记录已存在',
      });
    }

    const exchange = await alumniExchangeModel.createExchange({
      fromUserId,
      toUserId,
      status,
      message,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: '创建名片交换记录成功',
      data: exchange,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateExchangeStatus(req, res, next) {
  try {
    const exchangeId = Number(req.params.id);
    const status = parseExchangeStatus(req.body.status, undefined);

    if (!Number.isFinite(exchangeId) || exchangeId < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '交换记录ID不正确',
      });
    }

    if (status === null || status === undefined) {
      return sendError(res, {
        statusCode: 400,
        message: '交换状态参数不正确',
      });
    }

    const exchange = await alumniExchangeModel.findById(exchangeId);
    if (!exchange) {
      return sendError(res, {
        statusCode: 404,
        message: '交换记录不存在',
      });
    }

    const updatedExchange = await alumniExchangeModel.updateExchangeStatus(exchangeId, status);

    return sendSuccess(res, {
      message: '更新交换状态成功',
      data: updatedExchange,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listExchanges,
  createExchange,
  updateExchangeStatus,
};
