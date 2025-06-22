import type { Request, Response, NextFunction } from 'express'
import { usersService } from '../services/users.service.js'
import { createUserSchema, updateUserSchema, paginationSchema } from '@my/types'
import type { ApiResponse } from '@my/types'

export class UsersController {
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = paginationSchema.parse(req.query)
      const result = await usersService.getAllUsers(page, limit)

      const response: ApiResponse = {
        success: true,
        message: 'Users retrieved successfully',
        data: result,
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const user = await usersService.getUserById(id)

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        })
        return
      }

      const response: ApiResponse = {
        success: true,
        message: 'User retrieved successfully',
        data: { user },
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData = createUserSchema.parse(req.body)
      const user = await usersService.createUser(userData)

      const response: ApiResponse = {
        success: true,
        message: 'User created successfully',
        data: { user },
      }

      res.status(201).json(response)
    } catch (error) {
      next(error)
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const userData = updateUserSchema.parse(req.body)
      const user = await usersService.updateUser(id, userData)

      const response: ApiResponse = {
        success: true,
        message: 'User updated successfully',
        data: { user },
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      await usersService.deleteUser(id)

      const response: ApiResponse = {
        success: true,
        message: 'User deleted successfully',
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }
}

export const usersController = new UsersController() 