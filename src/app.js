// Express application assembly: mounts security, parsing, logging, routes, 404 handling, and global error handling.
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const env = require('./config/env');
const { sendError, sendSuccess } = require('./utils/response');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.cors.origin,
  credentials: env.cors.credentials,
}));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  return sendSuccess(res, {
    message: 'rongchuanAdminBackend 服务运行中',
    data: null,
  });
});

app.use('/api', routes);
app.use((req, res) => {
  return sendError(res, {
    statusCode: 404,
    message: '接口不存在',
  });
});
app.use(errorHandler);

module.exports = app;
