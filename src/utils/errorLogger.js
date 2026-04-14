const util = require('util');

function serializeError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port,
      statusCode: error.statusCode,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      context: error.context,
      stack: error.stack,
      cause: error.cause ? serializeError(error.cause) : undefined,
    };
  }

  return error;
}

function logError(label, error, context = {}) {
  const payload = {
    ...(Object.keys(context).length > 0 ? { context } : {}),
    error: serializeError(error),
  };

  console.error(`${label}\n${util.inspect(payload, { depth: null, colors: false, compact: false })}`);
}

module.exports = {
  logError,
};
