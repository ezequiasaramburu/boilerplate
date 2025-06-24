import { z } from 'zod';

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  avatar: z.string().url().optional(),
});

export const updateUserSchema = createUserSchema.partial();

export const userSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatar: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// User types
export type CreateUser = z.infer<typeof createUserSchema>
export type UpdateUser = z.infer<typeof updateUserSchema>
export type User = z.infer<typeof userSchema>
