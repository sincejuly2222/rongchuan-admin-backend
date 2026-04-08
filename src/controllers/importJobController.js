const XLSX = require('xlsx');
const importJobModel = require('../models/importJobModel');
const alumniUserModel = require('../models/alumniUserModel');
const { sendSuccess, sendError } = require('../utils/response');

function parseOptionalInteger(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = Number(value);
  return Number.isInteger(normalized) ? normalized : null;
}

function normalizeCellValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
}

function parseType(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim();
  return ['alumni', 'student'].includes(normalized) ? normalized : null;
}

function mapImportJob(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    operator_name: row.operator_name,
    status: row.status,
    total_count: row.total_count,
    success_count: row.success_count,
    failed_count: row.failed_count,
    error_details:
      typeof row.error_details === 'string' && row.error_details
        ? JSON.parse(row.error_details)
        : row.error_details,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function listImportJobs(req, res, next) {
  try {
    const current = Number(req.query.current || req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const type = req.query.type ? String(req.query.type).trim() : '';
    const status = parseOptionalInteger(req.query.status);

    if (!Number.isFinite(current) || current < 1 || !Number.isFinite(pageSize) || pageSize < 1) {
      return sendError(res, { statusCode: 400, message: '分页参数不正确' });
    }

    if (status === null) {
      return sendError(res, { statusCode: 400, message: '筛选参数不正确' });
    }

    const result = await importJobModel.listImportJobs({
      current,
      pageSize,
      type,
      status,
    });

    return sendSuccess(res, {
      message: '获取导入任务列表成功',
      data: {
        ...result,
        list: result.list.map(mapImportJob),
      },
    });
  } catch (error) {
    return next(error);
  }
}

function buildAlumniPayload(row) {
  return {
    name: normalizeCellValue(row['姓名']) || '',
    phone: normalizeCellValue(row['手机号']),
    openId: normalizeCellValue(row['OpenID']) || normalizeCellValue(row['openId']),
    company: normalizeCellValue(row['公司']) || normalizeCellValue(row['工作单位']),
    position: normalizeCellValue(row['职位']),
    city: normalizeCellValue(row['城市']),
    avatar: normalizeCellValue(row['头像']),
    bio: normalizeCellValue(row['简介']),
    status: 1,
    verifiedStatus: 0,
    allowSearch: 1,
  };
}

function buildStudentPayload(row) {
  return {
    school: normalizeCellValue(row['学校']) || '融川大学',
    college: normalizeCellValue(row['学院']),
    major: normalizeCellValue(row['专业']) || '',
    className: normalizeCellValue(row['班级']),
    studentNo: normalizeCellValue(row['学号']),
    enrollmentYear: Number(row['入学年份']),
    graduationYear: row['毕业年份'] ? Number(row['毕业年份']) : null,
    status: 0,
  };
}

async function processAlumniImport(rows) {
  const errors = [];
  let successCount = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const payload = buildAlumniPayload(rows[index]);

    if (!payload.name) {
      errors.push({ row: rowNumber, message: '姓名不能为空' });
      continue;
    }

    if (payload.phone) {
      const existingPhone = await alumniUserModel.findByPhone(payload.phone);
      if (existingPhone) {
        errors.push({ row: rowNumber, message: '手机号已存在' });
        continue;
      }
    }

    if (payload.openId) {
      const existingOpenId = await alumniUserModel.findByOpenId(payload.openId);
      if (existingOpenId) {
        errors.push({ row: rowNumber, message: 'OpenID 已存在' });
        continue;
      }
    }

    await alumniUserModel.createUser(payload);
    successCount += 1;
  }

  return {
    successCount,
    failedCount: errors.length,
    errors,
  };
}

async function processStudentImport(rows) {
  const errors = [];
  let successCount = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const alumniPayload = buildAlumniPayload(rows[index]);
    const studentPayload = buildStudentPayload(rows[index]);

    if (!alumniPayload.name) {
      errors.push({ row: rowNumber, message: '姓名不能为空' });
      continue;
    }

    if (!studentPayload.major || !Number.isInteger(studentPayload.enrollmentYear)) {
      errors.push({ row: rowNumber, message: '专业和入学年份不能为空且格式正确' });
      continue;
    }

    let user = null;

    if (alumniPayload.phone) {
      user = await alumniUserModel.findByPhone(alumniPayload.phone);
    }

    if (!user && alumniPayload.openId) {
      user = await alumniUserModel.findByOpenId(alumniPayload.openId);
    }

    if (!user) {
      user = await alumniUserModel.createUser({
        ...alumniPayload,
        verifiedStatus: 0,
      });
    } else {
      user = await alumniUserModel.findById(user.id);
    }

    await alumniUserModel.upsertStudentRecord(user.id, studentPayload);
    successCount += 1;
  }

  return {
    successCount,
    failedCount: errors.length,
    errors,
  };
}

async function uploadImportFile(req, res, next) {
  try {
    const type = parseType(req.body.type);
    const file = req.file;

    if (!type) {
      return sendError(res, { statusCode: 400, message: '导入类型不正确' });
    }

    if (!file) {
      return sendError(res, { statusCode: 400, message: '请上传 Excel 文件' });
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    const totalCount = rows.length;
    const result =
      type === 'alumni'
        ? await processAlumniImport(rows)
        : await processStudentImport(rows);

    const job = await importJobModel.createImportJob({
      name: file.originalname,
      type,
      operatorName: req.user.username || 'system',
      status: 2,
      totalCount,
      successCount: result.successCount,
      failedCount: result.failedCount,
      errorDetails: result.errors,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: '导入完成',
      data: mapImportJob(job),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listImportJobs,
  uploadImportFile,
};
