import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiResponse } from '../utils/response';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (
  fn: (req: Request<any, any, any, any>, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi server không xác định. Vui lòng thử lại sau.';

  const responsePayload: ApiResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { error: err.stack || err.message }),
  };

  res.status(statusCode).json(responsePayload);
};
