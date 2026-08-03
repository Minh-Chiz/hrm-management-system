import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import AppError from '../utils/AppError';

interface JwtPayload {
  id: number;
  email: string;
  role: string;
  name: string;
}

export const authenticateToken = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    throw new AppError('Không tìm thấy token xác thực. Vui lòng đăng nhập.', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Token đã hết hạn. Vui lòng đăng nhập lại.', 401);
    }
    throw new AppError('Token không hợp lệ.', 401);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Chưa xác thực. Vui lòng đăng nhập.', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: [${roles.join(', ')}].`,
        403
      );
    }

    next();
  };
};
