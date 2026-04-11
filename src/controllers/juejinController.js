const { sendError, sendSuccess } = require('../utils/response');

const JUEJIN_FRONTEND_CATEGORY_ID = '6809637767543259144';
const JUEJIN_AID = '2608';
const JUEJIN_UUID = '7585985343830525491';

function buildHotFrontendItem(item) {
  const id = item?.content?.content_id;
  const title = item?.content?.title ? String(item.content.title).trim() : '';

  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    authorName: item?.author?.name ? String(item.author.name).trim() : '\u6398\u91d1\u4f5c\u8005',
    viewCount: Number(item?.content_counter?.view) || 0,
    likeCount: Number(item?.content_counter?.like) || 0,
    commentCount: Number(item?.content_counter?.comment_count) || 0,
    hotRank: Number(item?.content_counter?.hot_rank) || 0,
    url: `https://juejin.cn/post/${id}`,
  };
}

async function getFrontendHotRank(req, res, next) {
  try {
    const params = new URLSearchParams({
      category_id: JUEJIN_FRONTEND_CATEGORY_ID,
      type: 'hot',
      aid: JUEJIN_AID,
      uuid: JUEJIN_UUID,
      spider: '0',
    });

    const response = await fetch(
      `https://api.juejin.cn/content_api/v1/content/article_rank?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          accept: '*/*',
          'content-type': 'application/json',
          referer: 'https://juejin.cn/',
        },
      },
    );

    if (!response.ok) {
      return sendError(res, {
        statusCode: 502,
        message: `\u6398\u91d1\u70ed\u699c\u8bf7\u6c42\u5931\u8d25: ${response.status}`,
      });
    }

    const result = await response.json();

    if (result?.err_no !== 0) {
      return sendError(res, {
        statusCode: 502,
        message: result?.err_msg || '\u6398\u91d1\u70ed\u699c\u8fd4\u56de\u5f02\u5e38',
      });
    }

    const list = Array.isArray(result?.data)
      ? result.data.map(buildHotFrontendItem).filter(Boolean)
      : [];

    return sendSuccess(res, {
      message: '\u83b7\u53d6\u6398\u91d1\u524d\u7aef\u70ed\u699c\u6210\u529f',
      data: {
        list,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getFrontendHotRank,
};
