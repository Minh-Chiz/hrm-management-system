import { z } from 'zod';

export const createRequestSchema = z.object({
  type: z.enum(['Nghỉ phép', 'WFH', 'Chấm công bù', 'OT'], {
    message: 'Vui lòng chọn loại đơn',
  }),
  description: z.string().min(3, 'Mô tả phải từ 3 ký tự'),
  reason: z.string().min(3, 'Lý do phải từ 3 ký tự'),
  date: z.string().min(1, 'Vui lòng nhập ngày áp dụng'),
  hasAttachment: z.boolean().optional(),
  attachmentName: z.string().optional(),
});

export type CreateRequestFormData = z.infer<typeof createRequestSchema>;
