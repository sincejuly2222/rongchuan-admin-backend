const alumniUserModel = require('../models/alumniUserModel');
const { sendSuccess, sendError } = require('../utils/response');

const NAME_MAX_LENGTH = 100;
const PHONE_REGEX = /^1\d{10}$/;

function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
}

function parseBinaryFlag(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = Number(value);
  if (normalized !== 0 && normalized !== 1) {
    return null;
  }

  return normalized;
}

function parseOptionalInteger(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = Number(value);
  return Number.isInteger(normalized) ? normalized : null;
}

function parseNullableInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const normalized = Number(value);
  return Number.isInteger(normalized) ? normalized : null;
}

function parseGender(value, defaultValue = null) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = Number(value);
  if (![0, 1, 2].includes(normalized)) {
    return null;
  }

  return normalized;
}

function parseVerifiedStatus(value, defaultValue = 0) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = Number(value);
  if (![0, 1, 2, 3].includes(normalized)) {
    return null;
  }

  return normalized;
}

function parseStudentStatus(value, defaultValue = 0) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = Number(value);
  if (![0, 1, 2].includes(normalized)) {
    return null;
  }

  return normalized;
}

function buildUserPayload(body, fallback = {}) {
  return {
    openId: normalizeOptionalString(body.openId) ?? fallback.openId ?? null,
    phone: normalizeOptionalString(body.phone) ?? fallback.phone ?? null,
    name: body.name ? String(body.name).trim() : fallback.name || '',
    avatar: normalizeOptionalString(body.avatar) ?? fallback.avatar ?? null,
    gender: body.gender !== undefined ? parseGender(body.gender) : fallback.gender ?? null,
    company: normalizeOptionalString(body.company) ?? fallback.company ?? null,
    position: normalizeOptionalString(body.position) ?? fallback.position ?? null,
    city: normalizeOptionalString(body.city) ?? fallback.city ?? null,
    bio: normalizeOptionalString(body.bio) ?? fallback.bio ?? null,
    status: body.status !== undefined ? parseBinaryFlag(body.status, undefined) : fallback.status,
    verifiedStatus:
      body.verifiedStatus !== undefined
        ? parseVerifiedStatus(body.verifiedStatus, undefined)
        : fallback.verifiedStatus,
    allowSearch:
      body.allowSearch !== undefined
        ? parseBinaryFlag(body.allowSearch, undefined)
        : fallback.allowSearch,
  };
}

async function listUsers(req, res, next) {
  try {
    const current = Number(req.query.current || req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';
    const status = parseOptionalInteger(req.query.status);
    const verifiedStatus = parseOptionalInteger(req.query.verifiedStatus);
    const enrollmentYear = parseOptionalInteger(req.query.enrollmentYear);
    const major = req.query.major ? String(req.query.major).trim() : '';
    const className = req.query.className ? String(req.query.className).trim() : '';
    const company = req.query.company ? String(req.query.company).trim() : '';

    if (!Number.isFinite(current) || current < 1 || !Number.isFinite(pageSize) || pageSize < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '分页参数不正确',
      });
    }

    if ([status, verifiedStatus, enrollmentYear].includes(null)) {
      return sendError(res, {
        statusCode: 400,
        message: '筛选参数不正确',
      });
    }

    const result = await alumniUserModel.listUsers({
      current,
      pageSize,
      keyword,
      status,
      verifiedStatus,
      enrollmentYear,
      major,
      className,
      company,
    });

    return sendSuccess(res, {
      message: '获取校友列表成功',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function getUserDetail(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isFinite(userId) || userId < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '校友ID不正确',
      });
    }

    const user = await alumniUserModel.findById(userId);
    if (!user) {
      return sendError(res, {
        statusCode: 404,
        message: '校友不存在',
      });
    }

    return sendSuccess(res, {
      message: '获取校友详情成功',
      data: user,
    });
  } catch (error) {
    return next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const payload = buildUserPayload(req.body, {
      status: 1,
      verifiedStatus: 0,
      allowSearch: 1,
    });

    if (!payload.name) {
      return sendError(res, {
        statusCode: 400,
        message: '姓名不能为空',
      });
    }

    if (payload.name.length > NAME_MAX_LENGTH) {
      return sendError(res, {
        statusCode: 400,
        message: '姓名长度不能超过 100 个字符',
      });
    }

    if (payload.phone && !PHONE_REGEX.test(payload.phone)) {
      return sendError(res, {
        statusCode: 400,
        message: '手机号格式不正确',
      });
    }

    if ([payload.gender, payload.status, payload.verifiedStatus, payload.allowSearch].includes(null)) {
      return sendError(res, {
        statusCode: 400,
        message: '参数不正确',
      });
    }

    if (payload.openId) {
      const existingOpenId = await alumniUserModel.findByOpenId(payload.openId);
      if (existingOpenId) {
        return sendError(res, {
          statusCode: 409,
          message: 'OpenID 已存在',
        });
      }
    }

    if (payload.phone) {
      const existingPhone = await alumniUserModel.findByPhone(payload.phone);
      if (existingPhone) {
        return sendError(res, {
          statusCode: 409,
          message: '手机号已存在',
        });
      }
    }

    const user = await alumniUserModel.createUser(payload);

    return sendSuccess(res, {
      statusCode: 201,
      message: '新增校友成功',
      data: user,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isFinite(userId) || userId < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '校友ID不正确',
      });
    }

    const existingUser = await alumniUserModel.findById(userId);
    if (!existingUser) {
      return sendError(res, {
        statusCode: 404,
        message: '校友不存在',
      });
    }

    const payload = buildUserPayload(req.body, {
      openId: existingUser.open_id,
      phone: existingUser.phone,
      name: existingUser.name,
      avatar: existingUser.avatar,
      gender: existingUser.gender,
      company: existingUser.company,
      position: existingUser.position,
      city: existingUser.city,
      bio: existingUser.bio,
      status: existingUser.status,
      verifiedStatus: existingUser.verified_status,
      allowSearch: existingUser.allow_search,
    });

    if (!payload.name) {
      return sendError(res, {
        statusCode: 400,
        message: '姓名不能为空',
      });
    }

    if (payload.phone && !PHONE_REGEX.test(payload.phone)) {
      return sendError(res, {
        statusCode: 400,
        message: '手机号格式不正确',
      });
    }

    if ([payload.gender, payload.status, payload.verifiedStatus, payload.allowSearch].includes(null)) {
      return sendError(res, {
        statusCode: 400,
        message: '参数不正确',
      });
    }

    if (payload.openId) {
      const existingOpenId = await alumniUserModel.findByOpenIdExcludingId(payload.openId, userId);
      if (existingOpenId) {
        return sendError(res, {
          statusCode: 409,
          message: 'OpenID 已存在',
        });
      }
    }

    if (payload.phone) {
      const existingPhone = await alumniUserModel.findByPhoneExcludingId(payload.phone, userId);
      if (existingPhone) {
        return sendError(res, {
          statusCode: 409,
          message: '手机号已存在',
        });
      }
    }

    const user = await alumniUserModel.updateUser(userId, payload);

    return sendSuccess(res, {
      message: '更新校友成功',
      data: user,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const status = parseBinaryFlag(req.body.status, undefined);

    if (!Number.isFinite(userId) || userId < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '校友ID不正确',
      });
    }

    if (status === null || status === undefined) {
      return sendError(res, {
        statusCode: 400,
        message: '状态参数不正确',
      });
    }

    const user = await alumniUserModel.findById(userId);
    if (!user) {
      return sendError(res, {
        statusCode: 404,
        message: '校友不存在',
      });
    }

    await alumniUserModel.updateStatus(userId, status);

    return sendSuccess(res, {
      message: '更新校友状态成功',
      data: {
        id: userId,
        status,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function upsertStudentRecord(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const school = req.body.school ? String(req.body.school).trim() : '';
    const college = normalizeOptionalString(req.body.college);
    const major = req.body.major ? String(req.body.major).trim() : '';
    const className = normalizeOptionalString(req.body.className);
    const studentNo = normalizeOptionalString(req.body.studentNo);
    const enrollmentYear = parseNullableInteger(req.body.enrollmentYear);
    const graduationYear = parseNullableInteger(req.body.graduationYear);
    const status = parseStudentStatus(req.body.status, 0);

    if (!Number.isFinite(userId) || userId < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '校友ID不正确',
      });
    }

    if (!school || !major || enrollmentYear === null) {
      return sendError(res, {
        statusCode: 400,
        message: '学校、专业和入学年份不能为空且格式正确',
      });
    }

    if (graduationYear === null && req.body.graduationYear !== undefined && req.body.graduationYear !== '') {
      return sendError(res, {
        statusCode: 400,
        message: '毕业年份格式不正确',
      });
    }

    if (status === null) {
      return sendError(res, {
        statusCode: 400,
        message: '学籍状态参数不正确',
      });
    }

    const user = await alumniUserModel.findById(userId);
    if (!user) {
      return sendError(res, {
        statusCode: 404,
        message: '校友不存在',
      });
    }

    const updatedUser = await alumniUserModel.upsertStudentRecord(userId, {
      school,
      college,
      major,
      className,
      studentNo,
      enrollmentYear,
      graduationYear,
      status,
    });

    return sendSuccess(res, {
      message: '保存学籍成功',
      data: updatedUser,
    });
  } catch (error) {
    return next(error);
  }
}

async function upsertCard(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const slogan = normalizeOptionalString(req.body.slogan);
    const showPhone = parseBinaryFlag(req.body.showPhone, 0);
    const showWechat = parseBinaryFlag(req.body.showWechat, 0);
    const wechat = normalizeOptionalString(req.body.wechat);
    const needApproval = parseBinaryFlag(req.body.needApproval, 0);
    const allowSearch = parseBinaryFlag(req.body.allowSearch, 1);

    if (!Number.isFinite(userId) || userId < 1) {
      return sendError(res, {
        statusCode: 400,
        message: '校友ID不正确',
      });
    }

    if ([showPhone, showWechat, needApproval, allowSearch].includes(null)) {
      return sendError(res, {
        statusCode: 400,
        message: '名片参数不正确',
      });
    }

    const user = await alumniUserModel.findById(userId);
    if (!user) {
      return sendError(res, {
        statusCode: 404,
        message: '校友不存在',
      });
    }

    const updatedUser = await alumniUserModel.upsertCard(userId, {
      slogan,
      showPhone,
      showWechat,
      wechat,
      needApproval,
      allowSearch,
    });

    return sendSuccess(res, {
      message: '保存名片成功',
      data: updatedUser,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listUsers,
  getUserDetail,
  createUser,
  updateUser,
  updateUserStatus,
  upsertStudentRecord,
  upsertCard,
};
