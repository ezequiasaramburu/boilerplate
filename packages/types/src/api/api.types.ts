import { z } from 'zod'

// API Response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
})

export const apiErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.string()).optional(),
})

// API Response types
export type ApiResponse<T = any> = {
  success: boolean
  message: string
  data?: T
}

export type ApiError = z.infer<typeof apiErrorSchema> 