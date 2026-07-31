import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  phone: z
    .string()
    .min(1, 'Vui lòng nhập số điện thoại')
    .min(10, 'Số điện thoại phải từ 10 chữ số')
    .max(12, 'Số điện thoại tối đa 12 chữ số'),
  avatar: z.string().optional(),
  password: z.string().optional(),
  team: z.string().optional(),
  specialization: z.string().optional(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
