const menuModel = require('../models/menuModel');
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

function parseParentId(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized < 0) {
    return null;
  }

  return normalized;
}

function parseSortOrder(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = Number(value);
  if (!Number.isInteger(normalized)) {
    return null;
  }

  return normalized;
}

function buildMenuTree(menus) {
  const menuMap = new Map();

  menus.forEach((menu) => {
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

async function listMenus(req, res, next) {
  try {
    const current = Number(req.query.current || req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const menuName = req.query.menuName ? String(req.query.menuName).trim() : '';
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

    const result = await menuModel.listMenus({
      current,
      pageSize,
      menuName,
      status,
    });

    return sendSuccess(res, {
      message: '获取菜单列表成功',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function listMenuTree(req, res, next) {
  try {
    const menus =
      req.query.scope === 'all'
        ? await menuModel.listAllMenus()
        : await menuModel.listMenusByUserId(req.user.userId);
    const tree = buildMenuTree(menus);

    return sendSuccess(res, {
      message: '获取菜单树成功',
      data: tree,
    });
  } catch (error) {
    return next(error);
  }
}

async function createMenu(req, res, next) {
  try {
    const parentId = parseParentId(req.body.parentId, 0);
    const menuName = req.body.menuName ? String(req.body.menuName).trim() : '';
    const menuCode = req.body.menuCode ? String(req.body.menuCode).trim() : '';
    const path = normalizeOptionalString(req.body.path);
    const component = normalizeOptionalString(req.body.component);
    const icon = normalizeOptionalString(req.body.icon);
    const sortOrder = parseSortOrder(req.body.sortOrder, 0);
    const status = parseStatus(req.body.status, 1);

    if (parentId === null) {
      return sendError(res, { statusCode: 400, message: '父级菜单参数不正确' });
    }

    if (!menuName || !menuCode) {
      return sendError(res, { statusCode: 400, message: '菜单名称和菜单编码不能为空' });
    }

    if (sortOrder === null) {
      return sendError(res, { statusCode: 400, message: '排序参数不正确' });
    }

    if (status === null) {
      return sendError(res, { statusCode: 400, message: '状态参数不正确' });
    }

    if (parentId > 0) {
      const parentMenu = await menuModel.findById(parentId);
      if (!parentMenu) {
        return sendError(res, { statusCode: 400, message: '父级菜单不存在' });
      }
    }

    const existingMenu = await menuModel.findByMenuCode(menuCode);
    if (existingMenu) {
      return sendError(res, { statusCode: 409, message: '菜单编码已存在' });
    }

    const menu = await menuModel.createMenu({
      parentId,
      menuName,
      menuCode,
      path,
      component,
      icon,
      sortOrder,
      status,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: '新增菜单成功',
      data: menu,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateMenu(req, res, next) {
  try {
    const menuId = Number(req.params.id);
    const parentId = parseParentId(req.body.parentId, 0);
    const menuName = req.body.menuName ? String(req.body.menuName).trim() : '';
    const menuCode = req.body.menuCode ? String(req.body.menuCode).trim() : '';
    const path = normalizeOptionalString(req.body.path);
    const component = normalizeOptionalString(req.body.component);
    const icon = normalizeOptionalString(req.body.icon);
    const sortOrder = parseSortOrder(req.body.sortOrder, 0);
    const status = parseStatus(req.body.status, undefined);

    if (!Number.isFinite(menuId) || menuId < 1) {
      return sendError(res, { statusCode: 400, message: '菜单ID不正确' });
    }

    if (parentId === null) {
      return sendError(res, { statusCode: 400, message: '父级菜单参数不正确' });
    }

    if (!menuName || !menuCode) {
      return sendError(res, { statusCode: 400, message: '菜单名称和菜单编码不能为空' });
    }

    if (sortOrder === null) {
      return sendError(res, { statusCode: 400, message: '排序参数不正确' });
    }

    if (status === null) {
      return sendError(res, { statusCode: 400, message: '状态参数不正确' });
    }

    const menu = await menuModel.findById(menuId);
    if (!menu) {
      return sendError(res, { statusCode: 404, message: '菜单不存在' });
    }

    if (parentId === menuId) {
      return sendError(res, { statusCode: 400, message: '父级菜单不能是自己' });
    }

    if (parentId > 0) {
      const parentMenu = await menuModel.findById(parentId);
      if (!parentMenu) {
        return sendError(res, { statusCode: 400, message: '父级菜单不存在' });
      }
    }

    const existingMenu = await menuModel.findByMenuCodeExcludingId(menuCode, menuId);
    if (existingMenu) {
      return sendError(res, { statusCode: 409, message: '菜单编码已存在' });
    }

    const updatedMenu = await menuModel.updateMenu(menuId, {
      parentId,
      menuName,
      menuCode,
      path,
      component,
      icon,
      sortOrder,
      status: status ?? menu.status,
    });

    return sendSuccess(res, {
      message: '编辑菜单成功',
      data: updatedMenu,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateMenuStatus(req, res, next) {
  try {
    const menuId = Number(req.params.id);
    const status = Number(req.body.status);

    if (!Number.isFinite(menuId) || menuId < 1) {
      return sendError(res, { statusCode: 400, message: '菜单ID不正确' });
    }

    if (status !== 0 && status !== 1) {
      return sendError(res, { statusCode: 400, message: '状态参数不正确' });
    }

    const menu = await menuModel.findById(menuId);
    if (!menu) {
      return sendError(res, { statusCode: 404, message: '菜单不存在' });
    }

    await menuModel.updateStatus(menuId, status);

    return sendSuccess(res, {
      message: '更新菜单状态成功',
      data: {
        id: menuId,
        status,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteMenu(req, res, next) {
  try {
    const menuId = Number(req.params.id);

    if (!Number.isFinite(menuId) || menuId < 1) {
      return sendError(res, { statusCode: 400, message: '菜单ID不正确' });
    }

    const menu = await menuModel.findById(menuId);
    if (!menu) {
      return sendError(res, { statusCode: 404, message: '菜单不存在' });
    }

    const childrenCount = await menuModel.countChildren(menuId);
    if (childrenCount > 0) {
      return sendError(res, {
        statusCode: 400,
        message: '当前菜单存在子菜单，不能直接删除',
      });
    }

    await menuModel.deleteMenu(menuId);

    return sendSuccess(res, {
      message: '删除菜单成功',
      data: {
        id: menuId,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createMenu,
  deleteMenu,
  listMenus,
  listMenuTree,
  updateMenu,
  updateMenuStatus,
};
