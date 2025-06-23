import { PrismaClient } from '@prisma/client'
import { PLAN_FEATURES } from '@my/types'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding subscription plans...')

  // Create subscription plans
  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for individuals and small projects',
      stripePriceId: 'price_starter_monthly', // Replace with actual Stripe price IDs
      stripeProductId: 'prod_starter',
      amount: 999, // $9.99
      currency: 'usd',
      interval: 'MONTH' as const,
      intervalCount: 1,
      trialDays: 14,
      features: PLAN_FEATURES.STARTER,
      maxUsers: 1,
      maxProjects: 5,
      maxStorage: BigInt(1 * 1024 * 1024 * 1024), // 1GB
      popular: false,
      active: true,
    },
    {
      name: 'Pro',
      description: 'Best for growing teams and businesses',
      stripePriceId: 'price_pro_monthly', // Replace with actual Stripe price IDs
      stripeProductId: 'prod_pro',
      amount: 2999, // $29.99
      currency: 'usd',
      interval: 'MONTH' as const,
      intervalCount: 1,
      trialDays: 14,
      features: PLAN_FEATURES.PRO,
      maxUsers: 10,
      maxProjects: null, // Unlimited
      maxStorage: BigInt(100 * 1024 * 1024 * 1024), // 100GB
      popular: true,
      active: true,
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with advanced needs',
      stripePriceId: 'price_enterprise_monthly', // Replace with actual Stripe price IDs
      stripeProductId: 'prod_enterprise',
      amount: 9999, // $99.99
      currency: 'usd',
      interval: 'MONTH' as const,
      intervalCount: 1,
      trialDays: 30,
      features: PLAN_FEATURES.ENTERPRISE,
      maxUsers: null, // Unlimited
      maxProjects: null, // Unlimited
      maxStorage: null, // Unlimited
      popular: false,
      active: true,
    },
    // Annual plans with discount
    {
      name: 'Pro Annual',
      description: 'Pro plan billed annually (2 months free)',
      stripePriceId: 'price_pro_annual', // Replace with actual Stripe price IDs
      stripeProductId: 'prod_pro',
      amount: 29999, // $299.99 (2 months free)
      currency: 'usd',
      interval: 'YEAR' as const,
      intervalCount: 1,
      trialDays: 14,
      features: PLAN_FEATURES.PRO,
      maxUsers: 10,
      maxProjects: null, // Unlimited
      maxStorage: BigInt(100 * 1024 * 1024 * 1024), // 100GB
      popular: false,
      active: true,
    },
    {
      name: 'Enterprise Annual',
      description: 'Enterprise plan billed annually (2 months free)',
      stripePriceId: 'price_enterprise_annual', // Replace with actual Stripe price IDs
      stripeProductId: 'prod_enterprise',
      amount: 99999, // $999.99 (2 months free)
      currency: 'usd',
      interval: 'YEAR' as const,
      intervalCount: 1,
      trialDays: 30,
      features: PLAN_FEATURES.ENTERPRISE,
      maxUsers: null, // Unlimited
      maxProjects: null, // Unlimited
      maxStorage: null, // Unlimited
      popular: false,
      active: true,
    },
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    })
    console.log(`✅ Created/updated plan: ${plan.name}`)
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 