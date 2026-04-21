// Authentication controller: handles registration, login, token rotation, logout, and current-user queries.
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const blogModel = require('../models/blogModel');
const userModel = require('../models/userModel');
const refreshSessionModel = require('../models/refreshSessionModel');
const menuModel = require('../models/menuModel');
const env = require('../config/env');
const {
  buildAccessTokenPayload,
  hashToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/token');
const { sendSuccess, sendError } = require('../utils/response');

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const PASSWORD_MIN_LENGTH = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const loginKeyPair = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

function decryptLoginPassword(encryptedPassword) {
  if (!encryptedPassword) {
    return '';
  }

  try {
    return crypto.privateDecrypt(
      {
        key: loginKeyPair.privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(String(encryptedPassword), 'base64')
    ).toString('utf8');
  } catch (error) {
    return '';
  }
}

function buildSafeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
  };
}

function buildCurrentUserProfile(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    title: user.title,
    bio: user.bio,
    gender: user.gender,
    location: user.location,
    website: user.website,
    birthday: user.birthday,
    startWorkDate: user.start_work_date,
    company: user.company,
    department: user.department,
    position: user.position,
    hobby: user.hobby || '',
    interestLikes: Array.isArray(user.interest_likes) ? user.interest_likes : [],
    interestDislikes: Array.isArray(user.interest_dislikes) ? user.interest_dislikes : [],
    interestSelection: user.interest_selection || {
      liked: Array.isArray(user.interest_likes) ? user.interest_likes : [],
      disliked: Array.isArray(user.interest_dislikes) ? user.interest_dislikes : [],
    },
    status: user.status,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    roleIds: user.role_ids || [],
    roleNames: user.role_names
      ? String(user.role_names)
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : [],
  };
}

function buildMenuTree(menus) {
  const menuMap = new Map();

  menus
    .filter((menu) => menu.status === 1)
    .forEach((menu) => {
      menuMap.set(menu.id, {
        ...menu,
        children: [],
      });
    });

  const roots = [];

  menuMap.forEach((menu) => {
    if (menu.parent_id > 0 && menuMap.has(menu.parent_id)) {
      menuMap.get(menu.parent_id).children.push(menu);
      return;
    }

    roots.push(menu);
  });

  return roots;
}

function buildHomeBlogList(blogs) {
  return blogs.map((blog) => ({
    id: blog.id,
    title: blog.title,
    summary: blog.summary,
    coverImage: blog.cover_image,
    categoryId: blog.category_id,
    category: blog.category_id
      ? {
          id: blog.category_id,
          name: blog.category_name,
          slug: blog.category_slug,
          description: blog.category_description,
          articleCount: blog.category_article_count ?? 0,
        }
      : null,
    tags: blog.tag_list,
    viewCount: blog.view_count,
    likeCount: blog.like_count,
    author: {
      id: blog.author_id,
      name: blog.author_name,
      avatar: blog.author_avatar,
    },
    publishedAt: blog.published_at,
    createdAt: blog.created_at,
  }));
}

function buildCurrentUserViews(userProfile, blogs = []) {
  const displayName = userProfile.name || userProfile.username;
  const primaryRole = userProfile.roleNames[0] || null;
  const titleParts = [userProfile.company, userProfile.department, userProfile.position].filter(Boolean);

  return {
    profile: userProfile,
    home: {
      displayName,
      greeting: `你好，${displayName}`,
      avatar: userProfile.avatar,
      title: userProfile.title,
      subtitle: titleParts.join(' / ') || primaryRole,
      company: userProfile.company,
      department: userProfile.department,
      position: userProfile.position,
      roleNames: userProfile.roleNames,
      blogs: buildHomeBlogList(blogs),
    },
    navbar: {
      username: userProfile.username,
      displayName,
      avatar: userProfile.avatar,
      title: userProfile.title,
      primaryRole,
      roleNames: userProfile.roleNames,
    },
  };
}

async function buildAuthBootstrapData(user) {
  const userProfile = buildCurrentUserProfile(user);
  const menus = await menuModel.listMenusByUserId(userProfile.id);
  const blogs = await blogModel.listHomeBlogs(6);

  return {
    user: userProfile,
    views: buildCurrentUserViews(userProfile, blogs),
    navigation: {
      menuTree: buildMenuTree(menus),
    },
  };
}

function buildRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.refreshCookie.secure,
    sameSite: env.refreshCookie.sameSite,
    domain: env.refreshCookie.domain,
    maxAge: env.refreshCookie.maxAge,
    path: env.refreshCookie.path,
  };
}

function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function getRequestIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip || req.socket.remoteAddress || null;
}

async function issueAuthTokens(req, res, user) {
  const sessionId = crypto.randomUUID();
  const refreshToken = signRefreshToken(user, sessionId);
  const refreshTokenHash = hashToken(refreshToken);
  const refreshExpiresAt = new Date(Date.now() + env.refreshToken.expiresInSeconds * 1000);

  await refreshSessionModel.createSession({
    userId: user.id,
    sessionId,
    tokenHash: refreshTokenHash,
    expiresAt: refreshExpiresAt,
    userAgent: req.get('user-agent') || null,
    ipAddress: getRequestIp(req),
  });

  res.cookie(env.refreshCookie.name, refreshToken, buildRefreshCookieOptions());

  return buildAccessTokenPayload(user);
}

async function register(req, res, next) {
  try {
    const username = req.body.username ? String(req.body.username).trim() : '';
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';
    const password = req.body.password ? String(req.body.password) : '';
    const avatar = req.body.avatar ? String(req.body.avatar).trim() : null;

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

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.createUser({
      username,
      email,
      password: hashedPassword,
      avatar,
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: '注册成功',
      data: buildSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function getLoginPublicKey(req, res, next) {
  try {
    return sendSuccess(res, {
      message: '获取登录公钥成功',
      data: {
        publicKey: loginKeyPair.publicKey,
        algorithm: 'RSA-OAEP-256',
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const username = req.body.username ? String(req.body.username).trim() : '';
    const password = decryptLoginPassword(req.body.encryptedPassword);

    if (!username || !password) {
      return sendError(res, {
        statusCode: 400,
        message: '用户名和加密密码不能为空',
      });
    }

    const user = await userModel.findByUsername(username);
    if (!user) {
      return sendError(res, {
        statusCode: 401,
        message: '用户名或密码错误',
      });
    }

    if (user.status !== 1) {
      return sendError(res, {
        statusCode: 403,
        message: '账号已被禁用',
      });
    }

    const passwordMatched = await bcrypt.compare(password, user.password);
    if (!passwordMatched) {
      return sendError(res, {
        statusCode: 401,
        message: '用户名或密码错误',
      });
    }

    await userModel.updateLastLoginAt(user.id);
    const tokenPayload = await issueAuthTokens(req, res, user);
    const currentUser = await userModel.findManagedUserById(user.id);

    return sendSuccess(res, {
      message: '登录成功',
      data: {
        ...tokenPayload,
        ...(await buildAuthBootstrapData(currentUser || user)),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies ? req.cookies[env.refreshCookie.name] : null;

    if (!refreshToken) {
      return sendError(res, {
        statusCode: 401,
        message: '缺少刷新令牌',
      });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return sendError(res, {
        statusCode: 401,
        message: '刷新令牌无效或已过期',
      });
    }

    if (payload.type !== 'refresh' || !payload.sessionId) {
      return sendError(res, {
        statusCode: 401,
        message: '刷新令牌无效或已过期',
      });
    }

    const session = await refreshSessionModel.findActiveSession(payload.sessionId);
    const refreshTokenHash = hashToken(refreshToken);

    if (
      !session ||
      session.user_id !== payload.userId ||
      session.refresh_token_hash !== refreshTokenHash ||
      session.revoked_at ||
      new Date(session.expires_at).getTime() <= Date.now()
    ) {
      return sendError(res, {
        statusCode: 401,
        message: '刷新令牌无效或已过期',
      });
    }

    const user = await userModel.findById(payload.userId);
    if (!user) {
      return sendError(res, {
        statusCode: 401,
        message: '用户不存在或已被删除',
      });
    }

    await refreshSessionModel.revokeSession(payload.sessionId);
    const tokenPayload = await issueAuthTokens(req, res, user);

    return sendSuccess(res, {
      message: '刷新成功',
      data: tokenPayload,
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies ? req.cookies[env.refreshCookie.name] : null;

    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        if (payload.sessionId) {
          await refreshSessionModel.revokeSession(payload.sessionId);
        }
      } catch (error) {
        // Ignore invalid refresh token during logout and continue clearing cookie.
      }
    }

    res.clearCookie(env.refreshCookie.name, buildRefreshCookieOptions());

    return sendSuccess(res, {
      message: '退出登录成功',
      data: null,
    });
  } catch (error) {
    return next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const user = await userModel.findManagedUserById(req.user.userId);

    if (!user) {
      return sendError(res, {
        statusCode: 404,
        message: '用户不存在',
      });
    }

    return sendSuccess(res, {
      message: '获取当前用户成功',
      data: await buildAuthBootstrapData(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function updateCurrentUserProfile(req, res, next) {
  try {
    const userId = req.user.userId;
    const name = req.body.name ? String(req.body.name).trim() : '';
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';
    const phone = normalizeOptionalString(req.body.phone);
    const avatar = normalizeOptionalString(req.body.avatar);
    const title = normalizeOptionalString(req.body.title);
    const bio = normalizeOptionalString(req.body.bio);
    const gender = normalizeOptionalString(req.body.gender);
    const location = normalizeOptionalString(req.body.location);
    const website = normalizeOptionalString(req.body.website);
    const birthday = normalizeOptionalString(req.body.birthday);
    const startWorkDate = normalizeOptionalString(req.body.startWorkDate);
    const company = normalizeOptionalString(req.body.company);
    const department = normalizeOptionalString(req.body.department);
    const position = normalizeOptionalString(req.body.position);
    const hobby = normalizeOptionalString(req.body.hobby);
    const interestLikes = normalizeStringArray(req.body.interestLikes);
    const interestDislikes = normalizeStringArray(req.body.interestDislikes);
    const interestSelection = {
      liked: interestLikes,
      disliked: interestDislikes,
    };

    if (!name || !email) {
      return sendError(res, {
        statusCode: 400,
        message: '姓名和邮箱不能为空',
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return sendError(res, {
        statusCode: 400,
        message: '邮箱格式不正确',
      });
    }

    const user = await userModel.findManagedUserById(userId);
    if (!user) {
      return sendError(res, {
        statusCode: 404,
        message: '用户不存在',
      });
    }

    const existingEmail = await userModel.findByEmailExcludingId(email, userId);
    if (existingEmail) {
      return sendError(res, {
        statusCode: 409,
        message: '邮箱已存在',
      });
    }

    const updatedUser = await userModel.updateCurrentUserProfile(userId, {
      name,
      email,
      phone,
      avatar,
      title,
      bio,
      gender,
      location,
      website,
      birthday,
      startWorkDate,
      company,
      department,
      hobby,
      interestLikes,
      interestDislikes,
      interestSelection,
      position,
    });

    return sendSuccess(res, {
      message: '更新个人信息成功',
      data: await buildAuthBootstrapData(updatedUser),
    });
  } catch (error) {
    return next(error);
  }
}

async function getAuthBootstrap(req, res, next) {
  try {
    const user = await userModel.findManagedUserById(req.user.userId);

    if (!user) {
      return sendError(res, {
        statusCode: 404,
        message: '用户不存在',
      });
    }

    return sendSuccess(res, {
      message: '获取初始化数据成功',
      data: await buildAuthBootstrapData(user),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  getLoginPublicKey,
  refresh,
  logout,
  getAuthBootstrap,
  getCurrentUser,
  updateCurrentUserProfile,
};
