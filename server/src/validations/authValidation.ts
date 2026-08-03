import { z } from 'zod';

// POST /api/auth/login
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ message: 'Vui lòng cung cấp email.' })
      .min(1, 'Email không được để trống.')
      .email('Định dạng email không hợp lệ.'),
    password: z
      .string({ message: 'Vui lòng cung cấp mật khẩu.' })
      .min(1, 'Mật khẩu không được để trống.'),
  }),
});

// POST /api/auth/register (or User creation)
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ message: 'Tên là bắt buộc.' })
      .min(1, 'Tên không được để trống.'),
    email: z
      .string({ message: 'Email là bắt buộc.' })
      .min(1, 'Email không được để trống.')
      .email('Định dạng email không hợp lệ.'),
    password: z
      .string({ message: 'Mật khẩu là bắt buộc.' })
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
    role: z.enum(['admin', 'teamlead', 'employee']).optional(),
    specialization: z.string().optional().nullable(),
    team: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    accentColor: z.string().optional(),
    avatar: z.string().optional().nullable(),
  }),
});

// PATCH /api/auth/profile
export const updateProfileSchema = z.object({
  body: z.object({
    phone: z.string().optional(),
    avatar: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự.')
      .optional(),
  }),
});
