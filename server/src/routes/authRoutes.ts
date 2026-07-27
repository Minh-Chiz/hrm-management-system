import { Router } from 'express';
import { login, getMe, updateProfile } from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Đăng nhập - không cần xác thực
router.post('/login', login);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Lấy thông tin user hiện tại - cần token hợp lệ
router.get('/me', authenticateToken, getMe);

// ─── PATCH /api/auth/profile ──────────────────────────────────────────────────
// Cập nhật thông tin cá nhân - cần token hợp lệ
router.patch('/profile', authenticateToken, updateProfile);

export default router;
