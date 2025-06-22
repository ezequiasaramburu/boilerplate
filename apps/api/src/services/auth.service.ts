import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '@my/database'
import type { 
  RegisterInput, 
  LoginInput, 
  AuthResponse, 
  AuthTokens, 
  JWTPayload,
  AuthUser,
  ChangePasswordInput 
} from '@my/types'

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key'
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
  private readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

  async register(userData: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      throw new Error('User already exists with this email')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
      }
    })

    // Generate tokens
    const tokens = await this.generateTokens(user)

    return {
      user: this.formatUserResponse(user),
      tokens
    }
  }

  async login(credentials: LoginInput): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: credentials.email }
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.password)

    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    // Generate tokens
    const tokens = await this.generateTokens(user)

    return {
      user: this.formatUserResponse(user),
      tokens
    }
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as JWTPayload

      // Find refresh token in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      })

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token')
      }

      // Generate new tokens
      const tokens = await this.generateTokens(storedToken.user)

      // Remove old refresh token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      })

      return tokens
    } catch (error) {
      throw new Error('Invalid refresh token')
    }
  }

  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    })
  }

  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId }
    })
  }

  async changePassword(userId: string, passwords: ChangePasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(passwords.currentPassword, user.password)

    if (!isValidPassword) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(passwords.newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    // Logout from all devices (invalidate all refresh tokens)
    await this.logoutAll(userId)
  }

  async verifyAccessToken(token: string): Promise<AuthUser> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as JWTPayload

      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      return this.formatUserResponse(user)
    } catch (error) {
      throw new Error('Invalid access token')
    }
  }

  private async generateTokens(user: any): Promise<AuthTokens> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    }

    // Generate access token
    const accessToken = jwt.sign(payload, this.JWT_SECRET, { 
      expiresIn: this.JWT_EXPIRES_IN 
    })

    // Generate refresh token
    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, { 
      expiresIn: this.JWT_REFRESH_EXPIRES_IN 
    })

    // Store refresh token in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    })

    return {
      accessToken,
      refreshToken
    }
  }

  private formatUserResponse(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }

  // Clean up expired refresh tokens (should be run as a cron job)
  async cleanupExpiredTokens(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
  }
}

export const authService = new AuthService() 