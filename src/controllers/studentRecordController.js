const studentRecordModel = require('../models/studentRecordModel');
const { sendSuccess, sendError } = require('../utils/response');

function parseOptionalInteger(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = Number(value);
  return Number.isInteger(normalized) ? normalized : null;
}

function parseStudentStatus(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = Number(value);
  if (![0, 1, 2].includes(normalized)) {
    return null;
  }

  return normalized;
}

async function listStudentRecords(req, res, next) {
  try {
    const current = Number(req.query.current || req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';
    const status = parseOptionalInteger(req.query.status);
    const enrollmentYear = parseOptionalInteger(req.query.enrollmentYear);
    const major = req.query.major ? String(req.query.major).trim() : '';

    if (!Number.isFinite(current) || current < 1 || !Number.isFinite(pageSize) || pageSize < 1) {
      return sendError(res, { statusCode: 400, message: '分页参数不正确' });
    }

    if ([status, enrollmentYear].includes(null)) {
      return sendError(res, { statusCode: 400, message: '筛选参数不正确' });
    }

    const result = await studentRecordModel.listStudentRecords({
      current,
      pageSize,
      keyword,
      status,
      enrollmentYear,
      major,
    });

    return sendSuccess(res, {
      message: '获取学籍列表成功',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateStudentRecordStatus(req, res, next) {
  try {
    const recordId = Number(req.params.id);
    const status = parseStudentStatus(req.body.status, undefined);

    if (!Number.isFinite(recordId) || recordId < 1) {
      return sendError(res, { statusCode: 400, message: '学籍记录ID不正确' });
    }

    if (status === null || status === undefined) {
      return sendError(res, { statusCode: 400, message: '学籍状态参数不正确' });
    }

    const record = await studentRecordModel.findById(recordId);
    if (!record) {
      return sendError(res, { statusCode: 404, message: '学籍记录不存在' });
    }

    await studentRecordModel.updateStudentRecordStatus(recordId, status);

    return sendSuccess(res, {
      message: '更新学籍状态成功',
      data: {
        id: recordId,
        status,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listStudentRecords,
  updateStudentRecordStatus,
};
