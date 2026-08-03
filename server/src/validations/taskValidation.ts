import { z } from 'zod';

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID task phải là một số hợp lệ.'),
});

// GET /api/tasks
export const getTasksSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    assigneeId: z.string().optional(),
  }),
});

// POST /api/tasks/master
export const createMasterProjectSchema = z.object({
  body: z.object({
    title: z
      .string({ message: 'Tiêu đề dự án là bắt buộc.' })
      .min(1, 'Tiêu đề dự án không được để trống.'),
    deadline: z
      .string({ message: 'Deadline là bắt buộc.' })
      .min(1, 'Deadline không được để trống.'),
    budget: z.string().optional().nullable(),
  }),
});

// POST /api/tasks
export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string({ message: 'Tiêu đề task là bắt buộc.' })
      .min(1, 'Tiêu đề task không được để trống.'),
    assigneeId: z.union([z.string(), z.number()], {
      message: 'Người được giao là bắt buộc.',
    }),
    deadline: z
      .string({ message: 'Deadline là bắt buộc.' })
      .min(1, 'Deadline không được để trống.'),
    supporters: z.array(z.any()).optional(),
    status: z.string().optional(),
    statusType: z.string().optional(),
    dueType: z.string().optional(),
    description: z.string().optional().nullable(),
    isMasterProject: z.boolean().optional(),
    masterTaskId: z.number().optional().nullable(),
    masterTaskTitle: z.string().optional().nullable(),
    creatorId: z.number().optional(),
    creatorName: z.string().optional(),
    progress: z.number().optional(),
    pipelineStage: z.string().optional().nullable(),
    handoverHistory: z.array(z.any()).optional(),
    budget: z.string().optional().nullable(),
  }),
});

// POST /api/tasks/:id/handover
export const handoverTaskStageSchema = z.object({
  params: idParamSchema,
  body: z.object({
    toStage: z
      .string({ message: 'Giai đoạn chuyển giao (toStage) là bắt buộc.' })
      .min(1, 'Giai đoạn chuyển giao không được để trống.'),
    approvedBy: z.string().optional(),
    nextAssigneeId: z.union([z.number(), z.string()]).optional().nullable(),
  }),
});

// POST /api/tasks/master/:id/advance
export const advanceMasterPipelineStageSchema = z.object({
  params: idParamSchema,
  body: z.object({
    currentStage: z.string().optional(),
    approvedBy: z.string().optional(),
    customTitle: z.string().optional(),
  }),
});

// PATCH /api/tasks/:id/progress
export const updateTaskProgressSchema = z.object({
  params: idParamSchema,
  body: z.object({
    progress: z
      .number({ message: 'Tiến độ là bắt buộc.' })
      .min(0, 'Tiến độ phải là một số từ 0 đến 100.')
      .max(100, 'Tiến độ phải là một số từ 0 đến 100.'),
  }),
});

// PATCH /api/tasks/:id/status
export const updateTaskStatusSchema = z.object({
  params: idParamSchema,
  body: z.object({
    status: z
      .string({ message: 'Trạng thái mới là bắt buộc.' })
      .min(1, 'Trạng thái mới không được để trống.'),
    statusType: z.string().optional(),
    dueType: z.string().optional(),
    progress: z.number().optional(),
    pipelineStage: z.string().optional(),
    handoverHistory: z.array(z.any()).optional(),
  }),
});

// PUT /api/tasks/:id
export const updateTaskSchema = z.object({
  params: idParamSchema,
  body: z.object({
    title: z.string().optional(),
    assigneeId: z.union([z.string(), z.number()]).optional(),
    supporters: z.array(z.any()).optional(),
    deadline: z.string().optional(),
    status: z.string().optional(),
    statusType: z.string().optional(),
    dueType: z.string().optional(),
    description: z.string().optional().nullable(),
    isMasterProject: z.boolean().optional(),
    masterTaskId: z.number().optional().nullable(),
    masterTaskTitle: z.string().optional().nullable(),
    creatorId: z.number().optional().nullable(),
    creatorName: z.string().optional(),
    progress: z.number().optional(),
    pipelineStage: z.string().optional().nullable(),
    handoverHistory: z.array(z.any()).optional(),
    budget: z.string().optional().nullable(),
  }),
});

// DELETE /api/tasks/:id
export const deleteTaskSchema = z.object({
  params: idParamSchema,
});
