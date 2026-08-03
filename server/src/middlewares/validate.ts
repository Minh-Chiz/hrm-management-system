import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { sendError } from '../utils/response';

export interface RequestValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validate = (schema: ZodSchema | RequestValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if ('parseAsync' in schema || 'parse' in schema) {
        const result: any = await (schema as ZodSchema).parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        if (result && typeof result === 'object') {
          if (result.body !== undefined) req.body = result.body;
          if (result.query !== undefined) req.query = result.query;
          if (result.params !== undefined) req.params = result.params;
        }
      } else {
        const { body, query, params } = schema as RequestValidationSchemas;
        if (body) {
          req.body = await body.parseAsync(req.body);
        }
        if (query) {
          req.query = (await query.parseAsync(req.query)) as any;
        }
        if (params) {
          req.params = (await params.parseAsync(req.params)) as any;
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues || [];
        const formattedErrors = issues.map((err) => ({
          field: err.path.filter((p) => p !== 'body' && p !== 'query' && p !== 'params').join('.'),
          message: err.message,
        }));

        const errorMessage = formattedErrors.map((e) => e.message).join(' ');
        sendError(res, errorMessage || 'Dữ liệu đầu vào không hợp lệ.', 400, JSON.stringify(formattedErrors));
        return;
      }
      next(error);
    }
  };
};
