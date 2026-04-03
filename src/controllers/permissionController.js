// Permission controller: serves paginated permission data for admin permission management.
const permissionModel = require('../models/permissionModel');
const { sendSuccess, sendError } = require('../utils/response');

function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
}

async function createPermission(req, res, next) {
  try {
    const permissionCode = req.body.permissionCode ? String(req.body.permissionCode).trim() : '';
    const permissionName = req.body.permissionName ? String(req.body.permissionName).trim() : '';
    const description = normalizeOptionalString(req.body.description);

    if (!permissionCode || !permissionName) {
      return sendError(res, {
        statusCode: 400,
        message: '权限编码和权限名称不能为空',
      });
    }

    const existingPermission = await permissionModel.findByPermissionCode(permissionCode);
    if (existingPermission) {
      return sendError(res, {
        statusCode: 409,
        message: '权限编码已存在',
      });
    }

    const permission = await permissionModel.createPermission({
      permissionCode,
      permissionName,
      description,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: '新增权限成功',
      data: permission,
    });
  } catch (error) {
    return next(error);
  }
}

async function listPermissions(req, res, next) {
  try {
    const current = Number(req.query.current || req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const permissionCode = req.query.permissionCode ? String(req.query.permissionCode).trim() : '';
    const permissionName = req.query.permissionName ? String(req.query.permissionName).trim() : '';

    if (!Number.isFinite(current) || current < 1 || !Number.isFinite(pageSize) || pageSize < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '分页参数不正确',
      });
    }

    const result = await permissionModel.listPermissions({
      current,
      pageSize,
      permissionCode,
      permissionName,
    });

    return sendSuccess(res, {
      message: '获取权限列表成功',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function updatePermission(req, res, next) {
  try {
    const permissionId = Number(req.params.id);
    const permissionCode = req.body.permissionCode ? String(req.body.permissionCode).trim() : '';
    const permissionName = req.body.permissionName ? String(req.body.permissionName).trim() : '';
    const description = normalizeOptionalString(req.body.description);

    if (!Number.isFinite(permissionId) || permissionId < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '权限ID不正确',
      });
    }

    if (!permissionCode || !permissionName) {
      return sendError(res, {
        statusCode: 400,
        message: '权限编码和权限名称不能为空',
      });
    }

    const permission = await permissionModel.findById(permissionId);
    if (!permission) {
      return sendError(res, {
        statusCode: 404,
        message: '权限不存在',
      });
    }

    const existingPermission = await permissionModel.findByPermissionCodeExcludingId(permissionCode, permissionId);
    if (existingPermission) {
      return sendError(res, {
        statusCode: 409,
        message: '权限编码已存在',
      });
    }

    const updatedPermission = await permissionModel.updatePermission(permissionId, {
      permissionCode,
      permissionName,
      description,
    });

    return sendSuccess(res, {
      message: '编辑权限成功',
      data: updatedPermission,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createPermission,
  listPermissions,
  updatePermission,
};
