// User controller: serves paginated admin user data for the frontend management table.
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const { sendSuccess, sendError } = require('../utils/response');

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const PASSWORD_MIN_LENGTH = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function parseRoleIds(value) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const roleIds = value.map((item) => Number(item));
  const allValid = roleIds.every((roleId) => Number.isInteger(roleId) && roleId > 0);

  if (!allValid) {
    return null;
  }

  return [...new Set(roleIds)];
}

async function validateRoleIds(roleIds) {
  if (roleIds.length === 0) {
    return true;
  }

  const existingRoleIds = await userModel.findRoleIds(roleIds);
  return existingRoleIds.length === roleIds.length;
}

async function createUser(req, res, next) {
  try {
    const username = req.body.username ? String(req.body.username).trim() : '';
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';
    const password = req.body.password ? String(req.body.password) : '';
    const name = normalizeOptionalString(req.body.name) || username;
    const phone = normalizeOptionalString(req.body.phone);
    const avatar = normalizeOptionalString(req.body.avatar);
    const status = parseStatus(req.body.status, 1);
    const roleIds = parseRoleIds(req.body.roleIds);

    if (!username || !email || !password) {
      return sendError(res, {
        statusCode: 400,
        message: '用户名、邮箱和密码不能为空',
      });
    }

    if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
      return sendError(res, {
        statusCode: 400,
        message: '用户名长度需在 3 到 20 个字符之间',
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return sendError(res, {
        statusCode: 400,
        message: '邮箱格式不正确',
      });
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return sendError(res, {
        statusCode: 400,
        message: '密码长度不能少于 6 位',
      });
    }

    if (status === null) {
      return sendError(res, {
        statusCode: 400,
        message: '状态参数不正确',
      });
    }

    if (roleIds === null) {
      return sendError(res, {
        statusCode: 400,
        message: '角色参数不正确',
      });
    }

    const existingUsername = await userModel.findByUsername(username);
    if (existingUsername) {
      return sendError(res, {
        statusCode: 409,
        message: '用户名已存在',
      });
    }

    const existingEmail = await userModel.findByEmail(email);
    if (existingEmail) {
      return sendError(res, {
        statusCode: 409,
        message: '邮箱已存在',
      });
    }

    const rolesValid = await validateRoleIds(roleIds);
    if (!rolesValid) {
      return sendError(res, {
        statusCode: 400,
        message: '角色不存在',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userModel.createManagedUser({
      username,
      passwordHash,
      name,
      email,
      phone,
      avatar,
      status,
      roleIds,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: '新增用户成功',
      data: user,
    });
  } catch (error) {
    return next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const current = Number(req.query.current || req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const username = req.query.username ? String(req.query.username).trim() : '';
    const name = req.query.name ? String(req.query.name).trim() : '';
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

    const result = await userModel.listUsers({
      current,
      pageSize,
      username,
      name,
      status,
    });

    return sendSuccess(res, {
      message: '获取用户列表成功',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const status = Number(req.body.status);

    if (!Number.isFinite(userId) || userId < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '用户ID不正确',
      });
    }

    if (status !== 0 && status !== 1) {
      return sendError(res, {
        statusCode: 400,
        message: '状态参数不正确',
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return sendError(res, {
        statusCode: 404,
        message: '用户不存在',
      });
    }

    await userModel.updateStatus(userId, status);

    return sendSuccess(res, {
      message: '更新用户状态成功',
      data: {
        id: userId,
        status,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const username = req.body.username ? String(req.body.username).trim() : '';
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';
    const password = req.body.password ? String(req.body.password) : '';
    const name = normalizeOptionalString(req.body.name) || username;
    const phone = normalizeOptionalString(req.body.phone);
    const avatar = normalizeOptionalString(req.body.avatar);
    const status = parseStatus(req.body.status, undefined);
    const roleIds = req.body.roleIds === undefined ? undefined : parseRoleIds(req.body.roleIds);

    if (!Number.isFinite(userId) || userId < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '用户ID不正确',
      });
    }

    if (!username || !email) {
      return sendError(res, {
        statusCode: 400,
        message: '用户名和邮箱不能为空',
      });
    }

    if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
      return sendError(res, {
        statusCode: 400,
        message: '用户名长度需在 3 到 20 个字符之间',
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return sendError(res, {
        statusCode: 400,
        message: '邮箱格式不正确',
      });
    }

    if (password && password.length < PASSWORD_MIN_LENGTH) {
      return sendError(res, {
        statusCode: 400,
        message: '密码长度不能少于 6 位',
      });
    }

    if (status === null) {
      return sendError(res, {
        statusCode: 400,
        message: '状态参数不正确',
      });
    }

    if (roleIds === null) {
      return sendError(res, {
        statusCode: 400,
        message: '角色参数不正确',
      });
    }

    const existingUser = await userModel.findManagedUserById(userId);
    if (!existingUser) {
      return sendError(res, {
        statusCode: 404,
        message: '用户不存在',
      });
    }

    const existingUsername = await userModel.findByUsernameExcludingId(username, userId);
    if (existingUsername) {
      return sendError(res, {
        statusCode: 409,
        message: '用户名已存在',
      });
    }

    const existingEmail = await userModel.findByEmailExcludingId(email, userId);
    if (existingEmail) {
      return sendError(res, {
        statusCode: 409,
        message: '邮箱已存在',
      });
    }

    if (Array.isArray(roleIds)) {
      const rolesValid = await validateRoleIds(roleIds);
      if (!rolesValid) {
        return sendError(res, {
          statusCode: 400,
          message: '角色不存在',
        });
      }
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

    const user = await userModel.updateManagedUser(userId, {
      username,
      name,
      email,
      passwordHash,
      phone,
      avatar,
      status: status ?? existingUser.status,
      roleIds,
    });

    return sendSuccess(res, {
      message: '编辑用户成功',
      data: user,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createUser,
  listUsers,
  updateUser,
  updateUserStatus,
};
