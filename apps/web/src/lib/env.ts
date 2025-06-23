import { z } from 'zod'

// Define the schema for environment variables
const envSchema = z.object({
  // API Configuration
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),
  
  // App Configuration
  NEXT_PUBLIC_APP_NAME: z.string().default('Enterprise App'),
  NEXT_PUBLIC_APP_DESCRIPTION: z.string().default('Enterprise-level application'),
  
  // Feature Flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.boolean().default(false),
  NEXT_PUBLIC_ENABLE_SENTRY: z.boolean().default(false),
  
  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
      NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
      NEXT_PUBLIC_ENABLE_SENTRY: process.env.NEXT_PUBLIC_ENABLE_SENTRY === 'true',
      NODE_ENV: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error('❌ Invalid environment variables:', error)
    throw new Error('Invalid environment variables')
  }
}

// Export validated environment variables
export const env = parseEnv()

// Type for environment variables
export type Environment = z.infer<typeof envSchema>

// Utility functions
export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test' 