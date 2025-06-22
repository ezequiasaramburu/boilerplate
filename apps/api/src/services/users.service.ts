import { prisma } from '@my/database'
import type { CreateUser, UpdateUser, User, PaginatedUsersResult } from '@my/types'

export class UsersService {
  async getAllUsers(page: number, limit: number): Promise<PaginatedUsersResult> {
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ])

    return {
      items: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    })
  }

  async createUser(userData: CreateUser): Promise<User> {
    return prisma.user.create({
      data: userData,
    })
  }

  async updateUser(id: string, userData: UpdateUser): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: userData,
    })
  }

  async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    })
  }
}

export const usersService = new UsersService() 