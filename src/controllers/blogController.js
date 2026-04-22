const blogModel = require('../models/blogModel');
const { sendError, sendSuccess } = require('../utils/response');

function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
}

function normalizeSlug(value) {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    return null;
  }

  return normalized
    .toLowerCase()
    .replace(/\s+/g, '-')
    .slice(0, 120);
}

function parseOptionalInteger(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = Number(value);
  return Number.isInteger(normalized) ? normalized : null;
}

function parseBlogStatus(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = Number(value);
  if (![0, 1].includes(normalized)) {
    return null;
  }

  return normalized;
}

function parseBooleanQuery(value) {
  if (value === undefined || value === null || value === '') {
    return false;
  }

  return ['1', 'true', 'yes'].includes(String(value).trim().toLowerCase());
}

function normalizeTagList(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => String(item).trim())
      .filter(Boolean);

    return normalized.length > 0 ? normalized.join(',') : null;
  }

  const normalized = String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized.join(',') : null;
}

function buildBlogCategory(blog) {
  if (!blog.category_id) {
    return null;
  }

  return {
    id: blog.category_id,
    name: blog.category_name,
    slug: blog.category_slug,
    description: blog.category_description,
    articleCount: blog.category_article_count ?? 0,
  };
}

function buildBlogListItem(blog) {
  return {
    id: blog.id,
    title: blog.title,
    summary: blog.summary,
    coverImage: blog.cover_image,
    categoryId: blog.category_id,
    category: buildBlogCategory(blog),
    tags: blog.tag_list,
    status: blog.status,
    viewCount: blog.view_count,
    likeCount: blog.like_count,
    author: {
      id: blog.author_id,
      name: blog.author_name,
      avatar: blog.author_avatar,
    },
    publishedAt: blog.published_at,
    createdAt: blog.created_at,
    updatedAt: blog.updated_at,
  };
}

function buildBlogDetail(blog) {
  return {
    ...buildBlogListItem(blog),
    content: blog.content,
  };
}

async function validateCategoryId(categoryId, res) {
  if (categoryId === undefined) {
    return undefined;
  }

  if (categoryId === null) {
    return null;
  }

  if (!Number.isInteger(categoryId) || categoryId < 1) {
    sendError(res, { statusCode: 400, message: '专栏分类参数不正确' });
    return false;
  }

  const category = await blogModel.findCategoryById(categoryId);
  if (!category || category.status !== 1) {
    sendError(res, { statusCode: 400, message: '专栏分类不存在或已停用' });
    return false;
  }

  return categoryId;
}

async function resolveOwnedBlog(blogId, userId, res) {
  const blog = await blogModel.findById(blogId);

  if (!blog) {
    sendError(res, { statusCode: 404, message: '博客不存在' });
    return null;
  }

  if (blog.author_id !== userId) {
    sendError(res, { statusCode: 403, message: '无权操作当前博客' });
    return null;
  }

  return blog;
}

async function resolveCategory(categoryId, res) {
  const category = await blogModel.findCategoryById(categoryId);

  if (!category) {
    sendError(res, { statusCode: 404, message: '专栏分类不存在' });
    return null;
  }

  return category;
}

async function validateCategoryPayload(req, res, existingId = null) {
  const name = req.body.name ? String(req.body.name).trim() : '';
  const slug = normalizeSlug(req.body.slug);
  const description = normalizeOptionalString(req.body.description);
  const sortOrderInput = parseOptionalInteger(req.body.sortOrder);

  if (!name) {
    sendError(res, { statusCode: 400, message: '分类名称不能为空' });
    return null;
  }

  if (sortOrderInput === null || (typeof sortOrderInput === 'number' && sortOrderInput < 0)) {
    sendError(res, { statusCode: 400, message: '排序值不正确' });
    return null;
  }

  const duplicatedName = await blogModel.findCategoryByName(name, existingId);
  if (duplicatedName) {
    sendError(res, { statusCode: 400, message: '分类名称已存在' });
    return null;
  }

  if (slug) {
    const duplicatedSlug = await blogModel.findCategoryBySlug(slug, existingId);
    if (duplicatedSlug) {
      sendError(res, { statusCode: 400, message: '分类 slug 已存在' });
      return null;
    }
  }

  const defaultSortOrder = existingId
    ? undefined
    : (await blogModel.findMaxCategorySortOrder()) + 1;

  return {
    name,
    slug,
    description,
    sortOrder: sortOrderInput ?? defaultSortOrder ?? 0,
  };
}

async function listBlogCategories(req, res, next) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 8;

    if (!Number.isFinite(limit) || limit < 1) {
      return sendError(res, { statusCode: 400, message: '分类数量参数不正确' });
    }

    const list = await blogModel.listBlogCategories(limit);

    return sendSuccess(res, {
      message: '获取博客分类成功',
      data: {
        list,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function listManageBlogCategories(req, res, next) {
  try {
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';
    const list = await blogModel.listManageBlogCategories({ keyword });

    return sendSuccess(res, {
      message: '获取专栏分类管理列表成功',
      data: {
        list,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function createBlogCategory(req, res, next) {
  try {
    const payload = await validateCategoryPayload(req, res);
    if (!payload) {
      return null;
    }

    const category = await blogModel.createBlogCategory(payload);

    return sendSuccess(res, {
      statusCode: 201,
      message: '新建专栏分类成功',
      data: category,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateBlogCategory(req, res, next) {
  try {
    const categoryId = Number(req.params.id);

    if (!Number.isFinite(categoryId) || categoryId < 1) {
      return sendError(res, { statusCode: 400, message: '专栏分类 ID 不正确' });
    }

    const existingCategory = await resolveCategory(categoryId, res);
    if (!existingCategory) {
      return null;
    }

    const payload = await validateCategoryPayload(req, res, categoryId);
    if (!payload) {
      return null;
    }

    const category = await blogModel.updateBlogCategory(categoryId, {
      ...payload,
      sortOrder: payload.sortOrder ?? existingCategory.sort_order ?? 0,
    });

    return sendSuccess(res, {
      message: '更新专栏分类成功',
      data: category,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteBlogCategory(req, res, next) {
  try {
    const categoryId = Number(req.params.id);

    if (!Number.isFinite(categoryId) || categoryId < 1) {
      return sendError(res, { statusCode: 400, message: '专栏分类 ID 不正确' });
    }

    const category = await resolveCategory(categoryId, res);
    if (!category) {
      return null;
    }

    const relatedBlogCount = await blogModel.countBlogsByCategory(categoryId);
    if (relatedBlogCount > 0) {
      return sendError(res, {
        statusCode: 400,
        message: '当前分类下还有文章，无法删除',
      });
    }

    await blogModel.deleteBlogCategory(categoryId);

    return sendSuccess(res, {
      message: '删除专栏分类成功',
      data: {
        id: categoryId,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function sortBlogCategories(req, res, next) {
  try {
    const orderedIds = Array.isArray(req.body.orderedIds)
      ? req.body.orderedIds.map((item) => Number(item))
      : [];

    if (orderedIds.length === 0 || orderedIds.some((id) => !Number.isInteger(id) || id < 1)) {
      return sendError(res, { statusCode: 400, message: '排序分类 ID 列表不正确' });
    }

    const categoryList = await blogModel.listManageBlogCategories();
    const categoryIds = new Set(categoryList.map((item) => item.id));

    if (orderedIds.length !== categoryIds.size || orderedIds.some((id) => !categoryIds.has(id))) {
      return sendError(res, { statusCode: 400, message: '排序分类列表必须覆盖全部分类' });
    }

    await blogModel.sortBlogCategories(orderedIds);

    return sendSuccess(res, {
      message: '专栏分类排序更新成功',
      data: {
        orderedIds,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function listBlogs(req, res, next) {
  try {
    const current = Number(req.query.current || req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';
    const status = parseOptionalInteger(req.query.status);
    const isAuthed = Boolean(req.user?.userId);
    const mine = parseBooleanQuery(req.query.mine);

    if (!Number.isFinite(current) || current < 1 || !Number.isFinite(pageSize) || pageSize < 1) {
      return sendError(res, { statusCode: 400, message: '分页参数不正确' });
    }

    if (status === null) {
      return sendError(res, { statusCode: 400, message: '状态参数不正确' });
    }

    if (!isAuthed && typeof status === 'number' && status !== 1) {
      return sendError(res, { statusCode: 401, message: '公开接口仅支持查看已发布博客' });
    }

    if (mine && !isAuthed) {
      return sendError(res, { statusCode: 401, message: '查看我的博客需要先登录' });
    }

    const shouldFilterAuthor = mine || (isAuthed && status === 0);

    const result = await blogModel.listBlogs({
      current,
      pageSize,
      keyword,
      status: typeof status === 'number' ? status : (isAuthed ? undefined : 1),
      authorId: shouldFilterAuthor ? req.user.userId : undefined,
    });

    return sendSuccess(res, {
      message: '获取博客列表成功',
      data: {
        ...result,
        list: result.list.map(buildBlogListItem),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getBlogDetail(req, res, next) {
  try {
    const blogId = Number(req.params.id);

    if (!Number.isFinite(blogId) || blogId < 1) {
      return sendError(res, { statusCode: 400, message: '博客 ID 不正确' });
    }

    const blog = await blogModel.findById(blogId);
    if (!blog || blog.status !== 1) {
      return sendError(res, { statusCode: 404, message: '博客不存在' });
    }

    await blogModel.incrementViewCount(blogId);
    const updatedBlog = await blogModel.findById(blogId);

    return sendSuccess(res, {
      message: '获取博客详情成功',
      data: buildBlogDetail(updatedBlog),
    });
  } catch (error) {
    return next(error);
  }
}

async function getEditableBlogDetail(req, res, next) {
  try {
    const blogId = Number(req.params.id);

    if (!Number.isFinite(blogId) || blogId < 1) {
      return sendError(res, { statusCode: 400, message: '博客 ID 不正确' });
    }

    const blog = await resolveOwnedBlog(blogId, req.user.userId, res);
    if (!blog) {
      return null;
    }

    return sendSuccess(res, {
      message: '获取博客编辑详情成功',
      data: buildBlogDetail(blog),
    });
  } catch (error) {
    return next(error);
  }
}

async function createBlog(req, res, next) {
  try {
    const title = req.body.title ? String(req.body.title).trim() : '';
    const content = req.body.content ? String(req.body.content).trim() : '';
    const summaryInput = normalizeOptionalString(req.body.summary);
    const coverImage = normalizeOptionalString(req.body.coverImage);
    const categoryIdInput = req.body.categoryId;
    const parsedCategoryId = parseOptionalInteger(categoryIdInput);
    const tagList = normalizeTagList(req.body.tags || req.body.tagList);
    const status = parseBlogStatus(req.body.status, 1);
    const summary = summaryInput || (content ? content.replace(/\s+/g, ' ').slice(0, 120) : null);

    if (!title || !content) {
      return sendError(res, { statusCode: 400, message: '博客标题和内容不能为空' });
    }

    if (status === null) {
      return sendError(res, { statusCode: 400, message: '状态参数不正确' });
    }

    if (parsedCategoryId === null && categoryIdInput !== undefined && categoryIdInput !== null && categoryIdInput !== '') {
      return sendError(res, { statusCode: 400, message: '专栏分类参数不正确' });
    }

    const categoryId = await validateCategoryId(parsedCategoryId, res);
    if (categoryId === false) {
      return null;
    }

    const blog = await blogModel.createBlog({
      title,
      summary,
      content,
      coverImage,
      categoryId: categoryId ?? null,
      tagList,
      status,
      authorId: req.user.userId,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: '发布博客成功',
      data: buildBlogDetail(blog),
    });
  } catch (error) {
    return next(error);
  }
}

async function updateBlog(req, res, next) {
  try {
    const blogId = Number(req.params.id);
    const title = req.body.title ? String(req.body.title).trim() : '';
    const content = req.body.content ? String(req.body.content).trim() : '';
    const summaryInput = normalizeOptionalString(req.body.summary);
    const coverImage = normalizeOptionalString(req.body.coverImage);
    const categoryIdInput = req.body.categoryId;
    const parsedCategoryId = parseOptionalInteger(categoryIdInput);
    const tagList = normalizeTagList(req.body.tags || req.body.tagList);
    const status = parseBlogStatus(req.body.status, 0);
    const summary = summaryInput || (content ? content.replace(/\s+/g, ' ').slice(0, 120) : null);

    if (!Number.isFinite(blogId) || blogId < 1) {
      return sendError(res, { statusCode: 400, message: '博客 ID 不正确' });
    }

    if (!title || !content) {
      return sendError(res, { statusCode: 400, message: '博客标题和内容不能为空' });
    }

    if (status === null) {
      return sendError(res, { statusCode: 400, message: '状态参数不正确' });
    }

    if (parsedCategoryId === null && categoryIdInput !== undefined && categoryIdInput !== null && categoryIdInput !== '') {
      return sendError(res, { statusCode: 400, message: '专栏分类参数不正确' });
    }

    const existingBlog = await resolveOwnedBlog(blogId, req.user.userId, res);
    if (!existingBlog) {
      return null;
    }

    const categoryId = await validateCategoryId(parsedCategoryId, res);
    if (categoryId === false) {
      return null;
    }

    const blog = await blogModel.updateBlog(blogId, {
      title,
      summary,
      content,
      coverImage,
      categoryId: categoryId ?? null,
      tagList,
      status,
    });

    return sendSuccess(res, {
      message: status === 1 ? '更新并发布博客成功' : '保存博客草稿成功',
      data: buildBlogDetail(blog),
    });
  } catch (error) {
    return next(error);
  }
}

async function updateBlogStatus(req, res, next) {
  try {
    const blogId = Number(req.params.id);
    const status = parseBlogStatus(req.body.status, undefined);

    if (!Number.isFinite(blogId) || blogId < 1) {
      return sendError(res, { statusCode: 400, message: '博客 ID 不正确' });
    }

    if (status === null || status === undefined) {
      return sendError(res, { statusCode: 400, message: '状态参数不正确' });
    }

    const existingBlog = await resolveOwnedBlog(blogId, req.user.userId, res);
    if (!existingBlog) {
      return null;
    }

    const blog = await blogModel.updateStatus(blogId, status);

    return sendSuccess(res, {
      message: status === 1 ? '博客已发布' : '博客已撤回为草稿',
      data: buildBlogDetail(blog),
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteBlog(req, res, next) {
  try {
    const blogId = Number(req.params.id);

    if (!Number.isFinite(blogId) || blogId < 1) {
      return sendError(res, { statusCode: 400, message: '博客 ID 不正确' });
    }

    const existingBlog = await resolveOwnedBlog(blogId, req.user.userId, res);
    if (!existingBlog) {
      return null;
    }

    await blogModel.deleteBlog(blogId);

    return sendSuccess(res, {
      message: '博客已删除',
      data: {
        id: blogId,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createBlog,
  createBlogCategory,
  deleteBlog,
  deleteBlogCategory,
  getBlogDetail,
  getEditableBlogDetail,
  listBlogCategories,
  listBlogs,
  listManageBlogCategories,
  sortBlogCategories,
  updateBlog,
  updateBlogCategory,
  updateBlogStatus,
};
