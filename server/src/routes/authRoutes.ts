import { Router } from 'express';
import { login, getMe, updateProfile } from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { loginSchema, updateProfileSchema } from '../validations/authValidation';

const router = Router();

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Đăng nhập - không cần xác thực
router.post('/login', validate(loginSchema), login);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Lấy thông tin user hiện tại - cần token hợp lệ
router.get('/me', authenticateToken, getMe);

// ─── PATCH /api/auth/profile ──────────────────────────────────────────────────
// Cập nhật thông tin cá nhân - cần token hợp lệ
router.patch('/profile', authenticateToken, validate(updateProfileSchema), updateProfile);

export default router;
