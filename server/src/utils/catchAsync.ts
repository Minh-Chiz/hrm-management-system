import { Request, Response, NextFunction, RequestHandler } from 'express';

export type AsyncRequestHandler = (
  req: Request<any, any, any, any>,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const catchAsync = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
