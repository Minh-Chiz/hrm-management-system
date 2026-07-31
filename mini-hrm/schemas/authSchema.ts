import { z } from 'zod';

export const loginSchema = z.object({
  companyCode: z.string().min(1, 'Vui lòng nhập mã công ty'),
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Định dạng email không hợp lệ'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
