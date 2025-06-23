import { Router } from 'express';
import { createUserSchema, updateUserSchema } from '@my/types';
import { validateRequest } from '../middleware/index.js';
import { usersController } from '../controllers/users.controller.js';

const router = Router();

// GET /api/users - Get all users with pagination
router.get('/', usersController.getAllUsers.bind(usersController));

// GET /api/users/:id - Get user by ID
router.get('/:id', usersController.getUserById.bind(usersController));

// POST /api/users - Create new user
router.post('/', validateRequest({ body: createUserSchema }), usersController.createUser.bind(usersController));

// PUT /api/users/:id - Update user
router.put('/:id', validateRequest({ body: updateUserSchema }), usersController.updateUser.bind(usersController));

// DELETE /api/users/:id - Delete user
router.delete('/:id', usersController.deleteUser.bind(usersController));

export { router as usersRouter };
