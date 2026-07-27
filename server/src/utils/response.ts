import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): Response => {
  const payload: ApiResponse<T> = {
    success: true,
  };
  if (data !== undefined) payload.data = data;
  if (message) payload.message = message;

  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  error?: string
): Response => {
  const payload: ApiResponse = {
    success: false,
    message,
  };
  if (error) payload.error = error;

  return res.status(statusCode).json(payload);
};
