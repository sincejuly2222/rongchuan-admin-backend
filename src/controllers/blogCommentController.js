const blogCommentModel = require('../models/blogCommentModel');
const { sendError, sendSuccess } = require('../utils/response');

function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return undefined;
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

function parseCommentStatus(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = Number(value);
  if (![0, 1, 2].includes(normalized)) {
    return null;
  }

  return normalized;
}

function buildCommentItem(comment) {
  return {
    id: comment.id,
    articleId: comment.blog_id,
    articleTitle: comment.blog_title,
    author: comment.author_name,
    authorEmail: comment.author_email,
    content: comment.content,
    status: comment.status,
    likes: comment.like_count,
    replyContent: comment.reply_content,
    repliedAt: comment.replied_at,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
  };
}

async function resolveComment(commentId, res) {
  const comment = await blogCommentModel.findById(commentId);

  if (!comment) {
    sendError(res, { statusCode: 404, message: '评论不存在' });
    return null;
  }

  return comment;
}

async function listComments(req, res, next) {
  try {
    const current = Number(req.query.current || req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';
    const status = parseCommentStatus(req.query.status);
    const blogId = parseOptionalInteger(req.query.articleId || req.query.blogId);

    if (!Number.isFinite(current) || current < 1 || !Number.isFinite(pageSize) || pageSize < 1) {
      return sendError(res, { statusCode: 400, message: '分页参数不正确' });
    }

    if (status === null) {
      return sendError(res, { statusCode: 400, message: '评论状态参数不正确' });
    }

    if (blogId === null || (typeof blogId === 'number' && blogId < 1)) {
      return sendError(res, { statusCode: 400, message: '文章 ID 参数不正确' });
    }

    const result = await blogCommentModel.listComments({
      current,
      pageSize,
      keyword,
      status,
      blogId,
    });

    return sendSuccess(res, {
      message: '获取评论管理列表成功',
      data: {
        ...result,
        list: result.list.map(buildCommentItem),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateComment(req, res, next) {
  try {
    const commentId = Number(req.params.id);
    const status = parseCommentStatus(req.body.status);
    const replyContent = normalizeOptionalString(req.body.replyContent);

    if (!Number.isFinite(commentId) || commentId < 1) {
      return sendError(res, { statusCode: 400, message: '评论 ID 不正确' });
    }

    if (status === null) {
      return sendError(res, { statusCode: 400, message: '评论状态参数不正确' });
    }

    if (status === undefined && replyContent === undefined) {
      return sendError(res, { statusCode: 400, message: '请至少提交一个要更新的字段' });
    }

    const existingComment = await resolveComment(commentId, res);
    if (!existingComment) {
      return null;
    }

    const comment = await blogCommentModel.updateComment(commentId, {
      status,
      replyContent,
    });

    return sendSuccess(res, {
      message: '评论更新成功',
      data: buildCommentItem(comment),
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteComment(req, res, next) {
  try {
    const commentId = Number(req.params.id);

    if (!Number.isFinite(commentId) || commentId < 1) {
      return sendError(res, { statusCode: 400, message: '评论 ID 不正确' });
    }

    const existingComment = await resolveComment(commentId, res);
    if (!existingComment) {
      return null;
    }

    await blogCommentModel.deleteComment(commentId);

    return sendSuccess(res, {
      message: '评论已删除',
      data: {
        id: commentId,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  deleteComment,
  listComments,
  updateComment,
};
