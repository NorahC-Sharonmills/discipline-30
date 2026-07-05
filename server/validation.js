import { z } from "zod";

export const authSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(2).max(80).optional()
});

export const dayIdSchema = z.coerce.number().int().min(1).max(30);

export const logSchema = z.object({
  checklist: z.record(z.string(), z.boolean()).default({}),
  actualKcal: z.union([z.number(), z.string()]).optional().default(""),
  actualWaterLiter: z.union([z.number(), z.string()]).optional().default(""),
  weight: z.union([z.number(), z.string()]).optional().default(""),
  waist: z.union([z.number(), z.string()]).optional().default(""),
  note: z.string().max(4000).default(""),
  completed: z.boolean().default(false)
});

export const editSchema = z.object({
  targetKcal: z.coerce.number().int().min(1000).max(5000),
  herbalType: z.string().max(500),
  breakfast: z.string().max(1000),
  lunch: z.string().max(1000),
  dinner: z.string().max(1000),
  pineappleNote: z.string().max(1000),
  warmLemonAfterMeal: z.string().max(1000),
  sleepBefore23: z.string().max(1000),
  exerciseNote: z.string().max(1000)
});

export const goalSchema = z.object({
  targetWeight: z.union([z.number(), z.string()]).optional().default(""),
  targetWaist: z.union([z.number(), z.string()]).optional().default(""),
  weeklyCompletion: z.coerce.number().int().min(1).max(7).default(5),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/).default("20:00"),
  timezone: z.string().min(3).max(80).default("Asia/Bangkok"),
  emailReminder: z.boolean().default(false)
});

export const planSchema = z.object({
  startDate: z.string().date(),
  endDate: z.string().date(),
  planData: z.record(z.string(), z.unknown()).default({})
}).refine((value) => value.endDate >= value.startDate, {
  message: "Ngày kết thúc phải sau ngày bắt đầu.",
  path: ["endDate"]
});
