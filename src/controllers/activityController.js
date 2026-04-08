const activityModel = require('../models/activityModel');
const organizationModel = require('../models/organizationModel');
const { sendSuccess, sendError } = require('../utils/response');

function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
}

function parseOptionalInteger(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = Number(value);
  return Number.isInteger(normalized) ? normalized : null;
}

function parseActivityStatus(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = Number(value);
  if (![0, 1, 2].includes(normalized)) {
    return null;
  }

  return normalized;
}

function parseNonNegativeInteger(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized >= 0 ? normalized : null;
}

async function listActivities(req, res, next) {
  try {
    const current = Number(req.query.current || req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';
    const type = req.query.type ? String(req.query.type).trim() : '';
    const city = req.query.city ? String(req.query.city).trim() : '';
    const status = parseOptionalInteger(req.query.status);
    const organizationId = parseOptionalInteger(req.query.organizationId);

    if (!Number.isFinite(current) || current < 1 || !Number.isFinite(pageSize) || pageSize < 1) {
      return sendError(res, { statusCode: 400, message: '分页参数不正确' });
    }

    if ([status, organizationId].includes(null)) {
      return sendError(res, { statusCode: 400, message: '筛选参数不正确' });
    }

    const result = await activityModel.listActivities({
      current,
      pageSize,
      keyword,
      type,
      status,
      city,
      organizationId,
    });

    return sendSuccess(res, {
      message: '获取活动列表成功',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function createActivity(req, res, next) {
  try {
    const name = req.body.name ? String(req.body.name).trim() : '';
    const type = req.body.type ? String(req.body.type).trim() : '';
    const organizationId = parseOptionalInteger(req.body.organizationId);
    const city = normalizeOptionalString(req.body.city);
    const venue = normalizeOptionalString(req.body.venue);
    const startTime = normalizeOptionalString(req.body.startTime);
    const endTime = normalizeOptionalString(req.body.endTime);
    const capacity = parseNonNegativeInteger(req.body.capacity, 0);
    const enrollments = parseNonNegativeInteger(req.body.enrollments, 0);
    const status = parseActivityStatus(req.body.status, 0);
    const description = normalizeOptionalString(req.body.description);

    if (!name || !type || !startTime) {
      return sendError(res, { statusCode: 400, message: '活动名称、活动类型和开始时间不能为空' });
    }

    if ([organizationId, capacity, enrollments, status].includes(null)) {
      return sendError(res, { statusCode: 400, message: '活动参数不正确' });
    }

    if (typeof organizationId === 'number') {
      const organization = await organizationModel.findById(organizationId);
      if (!organization) {
        return sendError(res, { statusCode: 400, message: '主办组织不存在' });
      }
    }

    const activity = await activityModel.createActivity({
      name,
      type,
      organizationId,
      city,
      venue,
      startTime,
      endTime,
      capacity,
      enrollments,
      status,
      description,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: '新增活动成功',
      data: activity,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateActivity(req, res, next) {
  try {
    const activityId = Number(req.params.id);
    const name = req.body.name ? String(req.body.name).trim() : '';
    const type = req.body.type ? String(req.body.type).trim() : '';
    const organizationId = parseOptionalInteger(req.body.organizationId);
    const city = normalizeOptionalString(req.body.city);
    const venue = normalizeOptionalString(req.body.venue);
    const startTime = normalizeOptionalString(req.body.startTime);
    const endTime = normalizeOptionalString(req.body.endTime);
    const capacity = parseNonNegativeInteger(req.body.capacity, 0);
    const enrollments = parseNonNegativeInteger(req.body.enrollments, 0);
    const status = parseActivityStatus(req.body.status, 0);
    const description = normalizeOptionalString(req.body.description);

    if (!Number.isFinite(activityId) || activityId < 1) {
      return sendError(res, { statusCode: 400, message: '活动ID不正确' });
    }

    if (!name || !type || !startTime) {
      return sendError(res, { statusCode: 400, message: '活动名称、活动类型和开始时间不能为空' });
    }

    if ([organizationId, capacity, enrollments, status].includes(null)) {
      return sendError(res, { statusCode: 400, message: '活动参数不正确' });
    }

    const currentActivity = await activityModel.findById(activityId);
    if (!currentActivity) {
      return sendError(res, { statusCode: 404, message: '活动不存在' });
    }

    if (typeof organizationId === 'number') {
      const organization = await organizationModel.findById(organizationId);
      if (!organization) {
        return sendError(res, { statusCode: 400, message: '主办组织不存在' });
      }
    }

    const activity = await activityModel.updateActivity(activityId, {
      name,
      type,
      organizationId,
      city,
      venue,
      startTime,
      endTime,
      capacity,
      enrollments,
      status,
      description,
    });

    return sendSuccess(res, {
      message: '更新活动成功',
      data: activity,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateActivityStatus(req, res, next) {
  try {
    const activityId = Number(req.params.id);
    const status = parseActivityStatus(req.body.status, undefined);

    if (!Number.isFinite(activityId) || activityId < 1) {
      return sendError(res, { statusCode: 400, message: '活动ID不正确' });
    }

    if (status === null || status === undefined) {
      return sendError(res, { statusCode: 400, message: '状态参数不正确' });
    }

    const activity = await activityModel.findById(activityId);
    if (!activity) {
      return sendError(res, { statusCode: 404, message: '活动不存在' });
    }

    await activityModel.updateStatus(activityId, status);

    return sendSuccess(res, {
      message: '更新活动状态成功',
      data: {
        id: activityId,
        status,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createActivity,
  listActivities,
  updateActivity,
  updateActivityStatus,
};
