import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import requestRoutes from './routes/requestRoutes';
import checkInRoutes from './routes/checkInRoutes';
import { errorHandler, AppError } from './middlewares/errorHandler';
import { sendSuccess } from './utils/response';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
}

// Health Check
app.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      tasks: '/api/tasks',
      requests: '/api/requests',
      checkin: '/api/checkin',
    },
  }, 'Server Mini HRM & Task Manager đang chạy ngon lành!');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/checkin', checkInRoutes);

// 404 Handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('Endpoint không tồn tại.', 404));
});

// Global Centralized Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ══════════════════════════════════════════');
  console.log(`   Mini HRM & Task Manager API Server`);
  console.log('   ──────────────────────────────────────────');
  console.log(`   🌐 URL:    http://localhost:${PORT}`);
  console.log(`   📋 Health: http://localhost:${PORT}/`);
  console.log('   ──────────────────────────────────────────');
  console.log(`   🔐 POST   /api/auth/login`);
  console.log(`   👤 GET    /api/auth/me`);
  console.log(`   ✏️  PATCH  /api/auth/profile`);
  console.log('   ──────────────────────────────────────────');
  console.log(`   👥 GET    /api/users`);
  console.log(`   ➕ POST   /api/users`);
  console.log(`   ✏️  PUT    /api/users/:id`);
  console.log(`   🗑️  DELETE /api/users/:id`);
  console.log('   ──────────────────────────────────────────');
  console.log(`   📋 GET    /api/tasks`);
  console.log(`   ➕ POST   /api/tasks`);
  console.log(`   🔄 PATCH  /api/tasks/:id/status`);
  console.log(`   ✏️  PUT    /api/tasks/:id`);
  console.log(`   🗑️  DELETE /api/tasks/:id`);
  console.log('   ──────────────────────────────────────────');
  console.log(`   📨 GET    /api/requests`);
  console.log(`   ➕ POST   /api/requests`);
  console.log(`   🔄 PATCH  /api/requests/:id/status`);
  console.log('   ──────────────────────────────────────────');
  console.log(`   ⏰ POST   /api/checkin`);
  console.log(`   📅 GET    /api/checkin/today`);
  console.log(`   📜 GET    /api/checkin/history`);
  console.log('🚀 ══════════════════════════════════════════');
  console.log(`   ⏱️  Khởi động: ${new Date().toLocaleString('vi-VN')}`);
  console.log('');
});

export default app;
