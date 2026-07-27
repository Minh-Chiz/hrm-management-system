import { Router } from 'express';
import { checkIn, getCheckInHistory, getTodayStatus } from '../controllers/checkInController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Tất cả route đều yêu cầu xác thực
router.use(authenticateToken);

// ─── POST /api/checkin ────────────────────────────────────────────────────────
// Check-in hoặc Check-out hôm nay (tự động xác định loại)
router.post('/', checkIn);

// ─── GET /api/checkin/today ───────────────────────────────────────────────────
// Lấy trạng thái check-in hôm nay của user hiện tại
// Phải đặt TRƯỚC /history để tránh bị route /:id bắt nhầm (nếu có)
router.get('/today', getTodayStatus);

// ─── GET /api/checkin/history ─────────────────────────────────────────────────
// Lấy lịch sử điểm danh
// Query: ?userId=xxx&date=yyyy-mm-dd&startDate=xxx&endDate=xxx&limit=50
router.get('/history', getCheckInHistory);

export default router;
