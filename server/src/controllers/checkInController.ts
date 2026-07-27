import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError, asyncHandler } from '../middlewares/errorHandler';
import { sendSuccess } from '../utils/response';
import { CheckInDTO, GetCheckInHistoryQueryDTO } from '../types/dtos';

const getTodayStr = (): string => new Date().toISOString().split('T')[0];

const getCurrentTime = (): string => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

// POST /api/checkin
export const checkIn = asyncHandler(
  async (req: Request<{}, {}, CheckInDTO>, res: Response): Promise<void> => {
    const { id: userId, name: userName } = req.user!;
    const todayStr = getTodayStr();

    const todayRecords = await prisma.checkIn.findMany({
      where: { userId, date: todayStr },
      orderBy: { createdAt: 'asc' },
    });

    // 1. Tìm xem có ca làm việc nào đang mở hay không (đã check-in nhưng chưa check-out)
    const openShiftRecord = ['Ca Sáng', 'Ca Chiều', 'Ca Tối'].map(s => {
      const shiftRecords = todayRecords.filter(r => r.shiftName === s);
      const hasIn = shiftRecords.some(r => r.type === 'in');
      const hasOut = shiftRecords.some(r => r.type === 'out');
      return { name: s, hasIn, hasOut };
    }).find(s => s.hasIn && !s.hasOut);

    let type: 'in' | 'out';
    let shiftName: string;

    if (openShiftRecord) {
      type = 'out';
      shiftName = openShiftRecord.name;
    } else {
      type = 'in';
      // 2. Xác định ca mới dựa trên khung giờ cố định của công ty
      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60;
      
      if (hour < 12.0) {
        shiftName = 'Ca Sáng';
      } else if (hour < 17.5) {
        shiftName = 'Ca Chiều';
      } else {
        shiftName = 'Ca Tối';
      }

      // Kiểm tra xem ca này đã được nhân viên hoàn thành (Check-out) hôm nay chưa
      const shiftRecords = todayRecords.filter(r => r.shiftName === shiftName);
      const hasOut = shiftRecords.some(r => r.type === 'out');
      if (hasOut) {
        throw new AppError(`Bạn đã hoàn thành điểm danh ${shiftName} hôm nay. Vui lòng quay lại vào ca làm tiếp theo.`, 400);
      }
    }

    const time = req.body.time || getCurrentTime();

    const record = await prisma.checkIn.create({
      data: {
        userId,
        userName,
        type,
        time,
        date: todayStr,
        shiftName,
      },
    });

    const msg =
      type === 'in'
        ? `✅ Check-in thành công [${shiftName}] lúc ${time}!`
        : `✅ Check-out thành công [${shiftName}] lúc ${time}!`;

    sendSuccess(res, record, msg, 201);
  }
);

// GET /api/checkin/history
export const getCheckInHistory = asyncHandler(
  async (req: Request<{}, {}, {}, GetCheckInHistoryQueryDTO>, res: Response): Promise<void> => {
    const { role, id: currentUserId } = req.user!;
    const { userId, date, startDate, endDate, limit } = req.query;

    const where: Record<string, unknown> = {};

    if (role === 'employee') {
      where.userId = currentUserId;
    } else {
      if (userId) {
        const parsedUserId = parseInt(String(userId), 10);
        if (!isNaN(parsedUserId)) {
          where.userId = parsedUserId;
        }
      }
    }

    if (date) {
      where.date = String(date);
    } else if (startDate || endDate) {
      const dateFilter: Record<string, string> = {};
      if (startDate) dateFilter.gte = String(startDate);
      if (endDate) dateFilter.lte = String(endDate);
      where.date = dateFilter;
    }

    const takeLimit = limit ? parseInt(String(limit), 10) : 100;

    const history = await prisma.checkIn.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            team: true,
            accentColor: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { time: 'desc' }, { createdAt: 'desc' }],
      take: Math.min(isNaN(takeLimit) ? 100 : takeLimit, 500),
    });

    const groupedByDate = history.reduce(
      (acc, record) => {
        const d = record.date;
        if (!acc[d]) acc[d] = [];
        acc[d].push(record);
        return acc;
      },
      {} as Record<string, typeof history>
    );

    sendSuccess(res, { history, groupedByDate });
  }
);

// GET /api/checkin/today
export const getTodayStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = req.user!;
    const todayStr = getTodayStr();

    const records = await prisma.checkIn.findMany({
      where: { userId, date: todayStr },
      orderBy: { createdAt: 'asc' },
    });

    const checkInRecord = records.find((r) => r.type === 'in');
    const checkOutRecord = records.find((r) => r.type === 'out');

    sendSuccess(res, {
      date: todayStr,
      hasCheckedIn: !!checkInRecord,
      hasCheckedOut: !!checkOutRecord,
      checkInTime: checkInRecord?.time || null,
      checkOutTime: checkOutRecord?.time || null,
      records,
    });
  }
);
