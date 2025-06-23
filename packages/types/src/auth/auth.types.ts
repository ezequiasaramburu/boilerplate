import { z } from 'zod'

// Authentication schemas
export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

// Authentication types
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// JWT payload type
export interface JWTPayload {
  userId: string
  email: string
  role?: string
  iat?: number
  exp?: number
}

// Authentication response types
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

import type { BaseUser } from '../common'

// Auth-specific user (same as BaseUser for now, but can be extended)
export type AuthUser = BaseUser

// Public user info (for API responses - exclude sensitive fields)
export type PublicUser = Omit<AuthUser, 'emailVerified'>

// User profile (for settings page - include editable fields)
export type UserProfile = Pick<AuthUser, 'id' | 'email' | 'name' | 'avatar'>

export interface AuthResponse {
  user: AuthUser
  tokens: AuthTokens
}

// Role enum
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

// OAuth Provider enum
export enum Provider {
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
  FACEBOOK = 'FACEBOOK',
  TWITTER = 'TWITTER',
  DISCORD = 'DISCORD',
  LINKEDIN = 'LINKEDIN'
}

// Social account types
export interface SocialAccount {
  id: string
  provider: Provider
  providerId: string
  email?: string
  name?: string
  avatar?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

// OAuth profile from providers
export interface OAuthProfile {
  id: string
  provider: Provider
  email?: string
  name?: string
  avatar?: string
  username?: string
}

// Social auth response
export interface SocialAuthResponse {
  user: AuthUser
  tokens: AuthTokens
  isNewUser: boolean
}

// Request types with authenticated user
export interface AuthenticatedRequest {
  user: AuthUser
} 