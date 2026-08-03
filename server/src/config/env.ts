import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  JWT_SECRET: z.string({ message: 'JWT_SECRET là bắt buộc.' }).min(1, 'JWT_SECRET không được để trống.'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  DATABASE_URL: z.string({ message: 'DATABASE_URL là bắt buộc.' }).min(1, 'DATABASE_URL không được để trống.'),
  CLIENT_URL: z.string().default('*'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Cấu hình biến môi trường không hợp lệ (Environment Validation Failed):');
  console.error(_env.error.format());
  throw new Error('Cấu hình môi trường không hợp lệ. Vui lòng kiểm tra lại file .env');
}

export const env = _env.data;
export default env;
