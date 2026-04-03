// Role controller: serves paginated role data for admin role management.
const roleModel = require('../models/roleModel');
const { sendSuccess, sendError } = require('../utils/response');

function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
}

function parseStatus(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = Number(value);
  if (normalized !== 0 && normalized !== 1) {
    return null;
  }

  return normalized;
}

function parsePermissionIds(value) {
  if (!Array.isArray(value)) {
    return null;
  }

  const permissionIds = value.map((item) => Number(item));
  const allValid = permissionIds.every((permissionId) => Number.isInteger(permissionId) && permissionId > 0);

  if (!allValid) {
    return null;
  }

  return [...new Set(permissionIds)];
}

async function listRoles(req, res, next) {
  try {
    const current = Number(req.query.current || req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const roleName = req.query.roleName ? String(req.query.roleName).trim() : '';
    const roleCode = req.query.roleCode ? String(req.query.roleCode).trim() : '';
    const statusQuery = req.query.status ? String(req.query.status).trim() : '';

    if (!Number.isFinite(current) || current < 1 || !Number.isFinite(pageSize) || pageSize < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '分页参数不正确',
      });
    }

    const status =
      statusQuery === ''
        ? undefined
        : statusQuery === '1' || statusQuery === '启用'
          ? 1
          : statusQuery === '0' || statusQuery === '禁用'
            ? 0
            : null;

    if (status === null) {
      return sendError(res, {
        statusCode: 400,
        message: '状态参数不正确',
      });
    }

    const result = await roleModel.listRoles({
      current,
      pageSize,
      roleName,
      roleCode,
      status,
    });

    return sendSuccess(res, {
      message: '获取角色列表成功',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function createRole(req, res, next) {
  try {
    const roleName = req.body.roleName ? String(req.body.roleName).trim() : '';
    const roleCode = req.body.roleCode ? String(req.body.roleCode).trim() : '';
    const description = normalizeOptionalString(req.body.description);
    const status = parseStatus(req.body.status, 1);

    if (!roleName || !roleCode) {
      return sendError(res, {
        statusCode: 400,
        message: '角色名称和角色编码不能为空',
      });
    }

    if (status === null) {
      return sendError(res, {
        statusCode: 400,
        message: '状态参数不正确',
      });
    }

    const existingRole = await roleModel.findByRoleCode(roleCode);
    if (existingRole) {
      return sendError(res, {
        statusCode: 409,
        message: '角色编码已存在',
      });
    }

    const role = await roleModel.createRole({
      roleName,
      roleCode,
      description,
      status,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: '新增角色成功',
      data: role,
    });
  } catch (error) {
    return next(error);
  }
}

async function getRolePermissions(req, res, next) {
  try {
    const roleId = Number(req.params.id);

    if (!Number.isFinite(roleId) || roleId < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '角色ID不正确',
      });
    }

    const role = await roleModel.findById(roleId);
    if (!role) {
      return sendError(res, {
        statusCode: 404,
        message: '角色不存在',
      });
    }

    const permissionIds = await roleModel.getRolePermissionIds(roleId);

    return sendSuccess(res, {
      message: '获取角色权限成功',
      data: {
        roleId,
        permissionIds,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateRolePermissions(req, res, next) {
  try {
    const roleId = Number(req.params.id);
    const permissionIds = parsePermissionIds(req.body.permissionIds);

    if (!Number.isFinite(roleId) || roleId < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '角色ID不正确',
      });
    }

    if (permissionIds === null) {
      return sendError(res, {
        statusCode: 400,
        message: '权限参数不正确',
      });
    }

    const role = await roleModel.findById(roleId);
    if (!role) {
      return sendError(res, {
        statusCode: 404,
        message: '角色不存在',
      });
    }

    const existingPermissionIds = await roleModel.findPermissionIds(permissionIds);
    if (existingPermissionIds.length !== permissionIds.length) {
      return sendError(res, {
        statusCode: 400,
        message: '权限不存在',
      });
    }

    const updatedPermissionIds = await roleModel.updateRolePermissions(roleId, permissionIds);

    return sendSuccess(res, {
      message: '更新角色权限成功',
      data: {
        roleId,
        permissionIds: updatedPermissionIds,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateRole(req, res, next) {
  try {
    const roleId = Number(req.params.id);
    const roleName = req.body.roleName ? String(req.body.roleName).trim() : '';
    const roleCode = req.body.roleCode ? String(req.body.roleCode).trim() : '';
    const description = normalizeOptionalString(req.body.description);
    const status = parseStatus(req.body.status, undefined);

    if (!Number.isFinite(roleId) || roleId < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '角色ID不正确',
      });
    }

    if (!roleName || !roleCode) {
      return sendError(res, {
        statusCode: 400,
        message: '角色名称和角色编码不能为空',
      });
    }

    if (status === null) {
      return sendError(res, {
        statusCode: 400,
        message: '状态参数不正确',
      });
    }

    const role = await roleModel.findById(roleId);
    if (!role) {
      return sendError(res, {
        statusCode: 404,
        message: '角色不存在',
      });
    }

    const existingRole = await roleModel.findByRoleCodeExcludingId(roleCode, roleId);
    if (existingRole) {
      return sendError(res, {
        statusCode: 409,
        message: '角色编码已存在',
      });
    }

    const updatedRole = await roleModel.updateRole(roleId, {
      roleName,
      roleCode,
      description,
      status: status ?? role.status,
    });

    return sendSuccess(res, {
      message: '编辑角色成功',
      data: updatedRole,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createRole,
  getRolePermissions,
  listRoles,
  updateRole,
  updateRolePermissions,
};
