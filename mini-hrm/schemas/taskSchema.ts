import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Tên công việc phải từ 3 ký tự'),
  assigneeId: z.string().min(1, 'Vui lòng chọn người thực hiện'),
  deadline: z.string().min(1, 'Vui lòng nhập hạn hoàn thành'),
  budget: z.string().optional(),
  supporters: z.array(z.string()).optional(),
  pipelineStage: z
    .enum(['design', 'development', 'testing', 'completed'])
    .optional(),
});

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
