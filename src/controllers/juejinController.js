const { sendError, sendSuccess } = require('../utils/response');

const JUEJIN_AID = '2608';
const JUEJIN_UUID = '7585985343830525491';
const JUEJIN_REFERER = 'https://juejin.cn/';
const JUEJIN_CATEGORY_API = 'https://api.juejin.cn/tag_api/v1/query_category_briefs';
const JUEJIN_RANK_API = 'https://api.juejin.cn/content_api/v1/content/article_rank';

const CATEGORY_KEY_MAP = {
  all: { name: '综合', categoryId: null, rank: 0, categoryUrl: 'recommended' },
  backend: { name: '后端', categoryId: '6809637769959178254', rank: 1, categoryUrl: 'backend' },
  frontend: { name: '前端', categoryId: '6809637767543259144', rank: 2, categoryUrl: 'frontend' },
  android: { name: 'Android', categoryId: '6809635626879549454', rank: 3, categoryUrl: 'android' },
  ios: { name: 'iOS', categoryId: '6809635626661445640', rank: 4, categoryUrl: 'ios' },
  ai: { name: '人工智能', categoryId: '6809637773935378440', rank: 5, categoryUrl: 'ai' },
  tools: { name: '开发工具', categoryId: '6809637771511070734', rank: 6, categoryUrl: 'freebie' },
  career: { name: '代码人生', categoryId: '6809637776263217160', rank: 7, categoryUrl: 'career' },
  reading: { name: '阅读', categoryId: '6809637772874219534', rank: 8, categoryUrl: 'article' },
};

const DEFAULT_CATEGORY_KEY = 'frontend';
const AGGREGATE_CATEGORY_KEYS = ['backend', 'frontend', 'android', 'ios', 'ai', 'tools', 'career', 'reading'];

function buildHotItem(item, fallbackCategory) {
  const id = item?.content?.content_id;
  const title = item?.content?.title ? String(item.content.title).trim() : '';

  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    authorName: item?.author?.name ? String(item.author.name).trim() : '掘金作者',
    viewCount: Number(item?.content_counter?.view) || 0,
    likeCount: Number(item?.content_counter?.like) || 0,
    commentCount: Number(item?.content_counter?.comment_count) || 0,
    hotRank: Number(item?.content_counter?.hot_rank) || 0,
    category: fallbackCategory,
    url: `https://juejin.cn/post/${id}`,
  };
}

function getCategoryMeta(categoryKey) {
  return CATEGORY_KEY_MAP[categoryKey] || CATEGORY_KEY_MAP[DEFAULT_CATEGORY_KEY];
}

async function requestJuejinJson(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
      referer: JUEJIN_REFERER,
    },
  });

  if (!response.ok) {
    throw Object.assign(new Error(`掘金请求失败: ${response.status}`), {
      statusCode: 502,
    });
  }

  const result = await response.json();

  if (result?.err_no !== 0) {
    throw Object.assign(new Error(result?.err_msg || '掘金返回异常'), {
      statusCode: 502,
    });
  }

  return result;
}

async function fetchJuejinCategoryRank(categoryKey) {
  const category = getCategoryMeta(categoryKey);

  if (!category.categoryId) {
    return [];
  }

  const params = new URLSearchParams({
    category_id: category.categoryId,
    type: 'hot',
    aid: JUEJIN_AID,
    uuid: JUEJIN_UUID,
    spider: '0',
  });

  const result = await requestJuejinJson(`${JUEJIN_RANK_API}?${params.toString()}`);

  return Array.isArray(result?.data)
    ? result.data.map((item) => buildHotItem(item, category.name)).filter(Boolean)
    : [];
}

async function fetchAggregateRank() {
  const categoryResults = await Promise.all(
    AGGREGATE_CATEGORY_KEYS.map(async (categoryKey) => {
      const items = await fetchJuejinCategoryRank(categoryKey);
      return items.slice(0, 8);
    }),
  );

  const mergedMap = new Map();

  categoryResults.flat().forEach((item) => {
    if (!mergedMap.has(item.id)) {
      mergedMap.set(item.id, item);
      return;
    }

    const current = mergedMap.get(item.id);
    if ((item.hotRank || 0) > (current.hotRank || 0)) {
      mergedMap.set(item.id, item);
    }
  });

  return Array.from(mergedMap.values())
    .sort((a, b) => (b.hotRank || 0) - (a.hotRank || 0))
    .slice(0, 30);
}

async function getJuejinCategories(req, res, next) {
  try {
    const result = await requestJuejinJson(JUEJIN_CATEGORY_API);
    const officialCategories = Array.isArray(result?.data)
      ? result.data
          .map((item) => {
            const match = Object.entries(CATEGORY_KEY_MAP).find(
              ([, value]) => value.categoryId && value.categoryId === item.category_id,
            );

            if (!match) {
              return null;
            }

            const [key, value] = match;

            return {
              key,
              name: value.name,
              categoryId: value.categoryId,
              categoryUrl: value.categoryUrl,
              rank: value.rank,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.rank - b.rank)
      : [];

    return sendSuccess(res, {
      message: '获取掘金分类成功',
      data: {
        list: [
          {
            key: 'all',
            name: '综合',
            categoryId: null,
            categoryUrl: 'recommended',
            rank: 0,
          },
          ...officialCategories,
        ],
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getHotRank(req, res, next) {
  try {
    const categoryKey = req.query.category ? String(req.query.category).trim() : DEFAULT_CATEGORY_KEY;
    const category = getCategoryMeta(categoryKey);
    const list = categoryKey === 'all'
      ? await fetchAggregateRank()
      : await fetchJuejinCategoryRank(categoryKey);

    return sendSuccess(res, {
      message: `获取掘金${category.name}热榜成功`,
      data: {
        category: {
          key: categoryKey in CATEGORY_KEY_MAP ? categoryKey : DEFAULT_CATEGORY_KEY,
          name: category.name,
          categoryId: category.categoryId,
          categoryUrl: category.categoryUrl,
        },
        list,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getFrontendHotRank(req, res, next) {
  try {
    const list = await fetchJuejinCategoryRank('frontend');

    return sendSuccess(res, {
      message: '获取掘金前端热榜成功',
      data: {
        list,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getJuejinCategories,
  getHotRank,
  getFrontendHotRank,
};
