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

function parseBinaryStatus(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = Number(value);
  if (![0, 1].includes(normalized)) {
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

async function listOrganizations(req, res, next) {
  try {
    const current = Number(req.query.current || req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';
    const type = req.query.type ? String(req.query.type).trim() : '';
    const city = req.query.city ? String(req.query.city).trim() : '';
    const status = parseOptionalInteger(req.query.status);

    if (!Number.isFinite(current) || current < 1 || !Number.isFinite(pageSize) || pageSize < 1) {
      return sendError(res, { statusCode: 400, message: '分页参数不正确' });
    }

    if (status === null) {
      return sendError(res, { statusCode: 400, message: '筛选参数不正确' });
    }

    const result = await organizationModel.listOrganizations({
      current,
      pageSize,
      keyword,
      type,
      status,
      city,
    });

    return sendSuccess(res, {
      message: '获取组织列表成功',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function createOrganization(req, res, next) {
  try {
    const name = req.body.name ? String(req.body.name).trim() : '';
    const type = req.body.type ? String(req.body.type).trim() : '';
    const principal = normalizeOptionalString(req.body.principal);
    const city = normalizeOptionalString(req.body.city);
    const memberCount = parseNonNegativeInteger(req.body.memberCount, 0);
    const pendingCount = parseNonNegativeInteger(req.body.pendingCount, 0);
    const activeCount = parseNonNegativeInteger(req.body.activeCount, 0);
    const foundedAt = normalizeOptionalString(req.body.foundedAt);
    const status = parseBinaryStatus(req.body.status, 1);
    const description = normalizeOptionalString(req.body.description);

    if (!name || !type) {
      return sendError(res, { statusCode: 400, message: '组织名称和组织类型不能为空' });
    }

    if ([memberCount, pendingCount, activeCount, status].includes(null)) {
      return sendError(res, { statusCode: 400, message: '组织参数不正确' });
    }

    const organization = await organizationModel.createOrganization({
      name,
      type,
      principal,
      city,
      memberCount,
      pendingCount,
      activeCount,
      foundedAt,
      status,
      description,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: '新增组织成功',
      data: organization,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateOrganization(req, res, next) {
  try {
    const organizationId = Number(req.params.id);
    const name = req.body.name ? String(req.body.name).trim() : '';
    const type = req.body.type ? String(req.body.type).trim() : '';
    const principal = normalizeOptionalString(req.body.principal);
    const city = normalizeOptionalString(req.body.city);
    const memberCount = parseNonNegativeInteger(req.body.memberCount, 0);
    const pendingCount = parseNonNegativeInteger(req.body.pendingCount, 0);
    const activeCount = parseNonNegativeInteger(req.body.activeCount, 0);
    const foundedAt = normalizeOptionalString(req.body.foundedAt);
    const status = parseBinaryStatus(req.body.status, 1);
    const description = normalizeOptionalString(req.body.description);

    if (!Number.isFinite(organizationId) || organizationId < 1) {
      return sendError(res, { statusCode: 400, message: '组织ID不正确' });
    }

    if (!name || !type) {
      return sendError(res, { statusCode: 400, message: '组织名称和组织类型不能为空' });
    }

    if ([memberCount, pendingCount, activeCount, status].includes(null)) {
      return sendError(res, { statusCode: 400, message: '组织参数不正确' });
    }

    const currentOrganization = await organizationModel.findById(organizationId);
    if (!currentOrganization) {
      return sendError(res, { statusCode: 404, message: '组织不存在' });
    }

    const organization = await organizationModel.updateOrganization(organizationId, {
      name,
      type,
      principal,
      city,
      memberCount,
      pendingCount,
      activeCount,
      foundedAt,
      status,
      description,
    });

    return sendSuccess(res, {
      message: '更新组织成功',
      data: organization,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateOrganizationStatus(req, res, next) {
  try {
    const organizationId = Number(req.params.id);
    const status = parseBinaryStatus(req.body.status, undefined);

    if (!Number.isFinite(organizationId) || organizationId < 1) {
      return sendError(res, { statusCode: 400, message: '组织ID不正确' });
    }

    if (status === null || status === undefined) {
      return sendError(res, { statusCode: 400, message: '状态参数不正确' });
    }

    const organization = await organizationModel.findById(organizationId);
    if (!organization) {
      return sendError(res, { statusCode: 404, message: '组织不存在' });
    }

    await organizationModel.updateStatus(organizationId, status);

    return sendSuccess(res, {
      message: '更新组织状态成功',
      data: {
        id: organizationId,
        status,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createOrganization,
  listOrganizations,
  updateOrganization,
  updateOrganizationStatus,
};
