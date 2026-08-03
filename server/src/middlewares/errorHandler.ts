import { Request, Response, NextFunction } from 'express';
import env from '../config/env';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import { sendError } from '../utils/response';

export { AppError, catchAsync };
export const asyncHandler = catchAsync;

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi server không xác định. Vui lòng thử lại sau.';

  if (env.NODE_ENV === 'development') {
    sendError(res, message, statusCode, err.stack || String(err));
    return;
  }

  // Production Mode
  if (err.isOperational) {
    sendError(res, message, statusCode);
    return;
  }

  // Non-operational / programming error: don't leak details to client
  console.error('💥 ERROR:', err);
  sendError(res, 'Lỗi server nội bộ. Vui lòng thử lại sau.', 500);
};
