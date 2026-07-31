import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError, asyncHandler } from '../middlewares/errorHandler';
import { sendSuccess } from '../utils/response';
import { CheckInDTO, GetCheckInHistoryQueryDTO } from '../types/dtos';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7 cố định, không phụ thuộc server timezone

const getVietnamNow = (): Date => {
  const utcMs = Date.now();
  return new Date(utcMs + VN_OFFSET_MS);
};

const getTodayStr = (): string => {
  const vnNow = getVietnamNow();
  const y = vnNow.getUTCFullYear();
  const m = String(vnNow.getUTCMonth() + 1).padStart(2, '0');
  const d = String(vnNow.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getCurrentTime = (): string => {
  const vnNow = getVietnamNow();
  const hh = String(vnNow.getUTCHours()).padStart(2, '0');
  const mm = String(vnNow.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const getVietnamHourDecimal = (): number => {
  const vnNow = getVietnamNow();
  return vnNow.getUTCHours() + vnNow.getUTCMinutes() / 60;
};

const formatMins = (mins: number): string => {
  if (mins <= 0) return '0 phút';
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  if (hrs === 0) return `${m} phút`;
  if (m === 0) return `${hrs} giờ`;
  return `${hrs} giờ ${m} phút`;
};

const evaluateStatusOnServer = (shiftName: string, type: string, timeStr: string) => {
  const shifts: Record<string, { start: number; end: number; grace: number }> = {
    'Ca Sáng': { start: 8 * 60, end: 12 * 60, grace: 5 },
    'Ca Chiều': { start: 13 * 60 + 30, end: 17 * 60 + 30, grace: 5 },
    'Ca Tối': { start: 18 * 60, end: 22 * 60, grace: 5 },
  };

  const config = shifts[shiftName] || shifts['Ca Sáng'];
  const parts = timeStr.split(':');
  const hh = parseInt(parts[0], 10) || 0;
  const mm = parseInt(parts[1], 10) || 0;
  const timeMins = hh * 60 + mm;

  if (type === 'in') {
    const maxAllowed = config.start + config.grace;
    if (timeMins > maxAllowed) {
      const lateMinutes = timeMins - config.start;
      return {
        status: 'LATE',
        lateMinutes,
        earlyMinutes: 0,
        note: `Điểm danh muộn ${formatMins(lateMinutes)}`,
      };
    }
    return {
      status: 'ON_TIME',
      lateMinutes: 0,
      earlyMinutes: 0,
      note: `Điểm danh đúng giờ.`,
    };
  } else {
    if (timeMins < config.end) {
      const earlyMinutes = config.end - timeMins;
      return {
        status: 'EARLY_LEAVE',
        lateMinutes: 0,
        earlyMinutes,
        note: `Check-out sớm ${formatMins(earlyMinutes)}`,
      };
    }
    return {
      status: 'NORMAL',
      lateMinutes: 0,
      earlyMinutes: 0,
      note: `Check-out hoàn thành ca.`,
    };
  }
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
      const hour = getVietnamHourDecimal();
      
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
    let status = req.body.status;
    let lateMinutes = req.body.lateMinutes;
    let earlyMinutes = req.body.earlyMinutes;
    let note = req.body.note;

    if (!status) {
      const evalRes = evaluateStatusOnServer(shiftName, type, time);
      status = evalRes.status;
      lateMinutes = evalRes.lateMinutes;
      earlyMinutes = evalRes.earlyMinutes;
      note = evalRes.note;
    }

    const record = await prisma.checkIn.create({
      data: {
        userId,
        userName,
        type,
        time,
        date: todayStr,
        shiftName,
        status,
        lateMinutes,
        earlyMinutes,
        note,
      } as any,
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

    const enrichedHistory = history.map((record) => {
      const rec = record as any;
      let status = rec.status;
      let lateMinutes = rec.lateMinutes;
      let earlyMinutes = rec.earlyMinutes;
      let note = rec.note;
      if (!status) {
        const evalRes = evaluateStatusOnServer(rec.shiftName || 'Ca Sáng', rec.type, rec.time);
        status = evalRes.status;
        lateMinutes = evalRes.lateMinutes;
        earlyMinutes = evalRes.earlyMinutes;
        note = evalRes.note;
      }
      return {
        ...record,
        status,
        lateMinutes,
        earlyMinutes,
        note,
      };
    });

    const groupedByDate = enrichedHistory.reduce(
      (acc, record) => {
        const d = record.date;
        if (!acc[d]) acc[d] = [];
        acc[d].push(record);
        return acc;
      },
      {} as Record<string, typeof enrichedHistory>
    );

    sendSuccess(res, { history: enrichedHistory, groupedByDate });
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

    const enrichedRecords = records.map((record) => {
      const rec = record as any;
      let status = rec.status;
      let lateMinutes = rec.lateMinutes;
      let earlyMinutes = rec.earlyMinutes;
      let note = rec.note;
      if (!status) {
        const evalRes = evaluateStatusOnServer(rec.shiftName || 'Ca Sáng', rec.type, rec.time);
        status = evalRes.status;
        lateMinutes = evalRes.lateMinutes;
        earlyMinutes = evalRes.earlyMinutes;
        note = evalRes.note;
      }
      return {
        ...record,
        status,
        lateMinutes,
        earlyMinutes,
        note,
      };
    });

    const checkInRecord = enrichedRecords.find((r) => r.type === 'in');
    const checkOutRecord = enrichedRecords.find((r) => r.type === 'out');

    sendSuccess(res, {
      date: todayStr,
      hasCheckedIn: !!checkInRecord,
      hasCheckedOut: !!checkOutRecord,
      checkInTime: checkInRecord?.time || null,
      checkOutTime: checkOutRecord?.time || null,
      records: enrichedRecords,
    });
  }
);
