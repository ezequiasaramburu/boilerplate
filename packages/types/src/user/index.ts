// Re-export all user-related types
export * from './user.types';

// Import for composite types
import type { User } from './user.types';
import type { PaginatedResult } from '../common';

// User-specific pagination type
export type PaginatedUsersResult = PaginatedResult<User>
