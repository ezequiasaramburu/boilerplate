import { z } from 'zod'

// Query schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
})

export const sortSchema = z.object({
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Common types
export type Pagination = z.infer<typeof paginationSchema>
export type Sort = z.infer<typeof sortSchema>

// Generic pagination result interface
export interface PaginatedResult<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Base user type - single source of truth
export interface BaseUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
  role: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
} 