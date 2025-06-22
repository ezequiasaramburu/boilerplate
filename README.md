# Full-Stack Monorepo Boilerplate

A production-ready monorepo boilerplate built with TypeScript, featuring a Next.js frontend, Express.js API, and PostgreSQL database.

## 🚀 **Tech Stack**

### **Frontend**

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

### **Backend**

- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Database

### **Shared Packages**

- **@my/ui** - Shared UI components
- **@my/types** - Shared TypeScript types & Zod schemas
- **@my/database** - Database client & utilities
- **@my/utils** - Shared utilities

### **Development Tools**

- **Turbo** - Monorepo build system
- **pnpm** - Package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📦 **Project Structure**

```
boilerplate/
├── apps/
│   ├── api/                 # Express.js API
│   │   ├── src/
│   │   │   ├── middleware/  # API middleware
│   │   │   ├── routes/      # API routes
│   │   │   └── index.ts     # API entry point
│   │   └── package.json
│   └── web/                 # Next.js frontend
│       ├── pages/           # Next.js pages
│       ├── styles/          # Global styles
│       └── package.json
├── packages/
│   ├── database/            # Prisma database package
│   │   ├── prisma/          # Database schema & migrations
│   │   └── src/             # Database utilities
│   ├── types/               # Shared TypeScript types & Zod schemas
│   ├── ui/                  # Shared UI components (shadcn/ui)
│   └── utils/               # Shared utilities
├── package.json             # Root package.json
├── turbo.json              # Turbo configuration
└── tsconfig.base.json      # Base TypeScript configuration
```

## 🛠️ **Quick Start**

### **Prerequisites**

- Node.js 18+
- pnpm
- PostgreSQL database running on your machine

### **1. Clone & Install**

```bash
git clone <repository-url>
cd boilerplate
pnpm install
```

### **2. Environment Setup**

In a monorepo, you need environment files in specific locations:

```bash
# 1. Create API environment file
cp apps/api/env.example apps/api/.env

# 2. Create database environment file
echo 'DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"' > packages/database/.env
```

**Update both `.env` files with your actual values:**

**`apps/api/.env`** (main API configuration):

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/your_database_name"
JWT_SECRET=your-super-secret-jwt-key-here
STRIPE_SECRET_KEY=sk_test_... # Optional
# ... other values from env.example
```

**`packages/database/.env`** (for Prisma CLI):

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/your_database_name"
```

### **3. Database Setup** (Run in order!)

```bash
# 1. Create tables in your database
pnpm db:push

# 2. Generate TypeScript client code
pnpm db:generate

# 3. (Optional) Add sample subscription plans
pnpm db:seed

# 4. (Optional) View your data in browser
pnpm db:studio
```

> **Important**: Run `db:push` first, then `db:generate`. The push creates tables, generate creates TypeScript types.

### **4. Start Development**

```bash
pnpm dev
```

This starts:

- **API**: http://localhost:4000
- **Web**: http://localhost:3000

### **5. Verify Setup**

- Visit http://localhost:4000/health - should return `{"success": true}`
- Visit http://localhost:3000 - should load the Next.js app
- Visit http://localhost:5555 (if you ran `db:studio`) - browse your database

## 📝 **Available Scripts**

### **🚀 Development**

```bash
pnpm dev              # Start all apps in development mode (API + Web)
pnpm build            # Build all apps for production
pnpm lint             # Lint all packages
pnpm type-check       # Type check all packages
pnpm clean            # Clean build artifacts
```

### **🗄️ Database Management**

```bash
pnpm db:push          # Push schema to database (development)
pnpm db:generate      # Generate Prisma client types
pnpm db:migrate       # Run database migrations (production)
pnpm db:studio        # Open Prisma Studio (database browser)
pnpm db:seed          # Seed database with sample subscription plans
```

### **⚙️ Setup & Installation**

```bash
pnpm install:packages # Install all dependencies
pnpm setup            # Full setup: install deps + generate Prisma client
```

### **📦 Individual Package Scripts**

```bash
# Run scripts in specific packages
pnpm --filter api dev           # Start only API server
pnpm --filter web dev           # Start only web app
pnpm --filter @my/database <script>  # Run database package scripts
```

> **💡 Pro tip**: Most scripts use Turbo to run across all packages in parallel for maximum speed!

## 🏗️ **API Endpoints**

### **🏥 Health & Monitoring**

- `GET /health` - API health check
- `GET /api/v1/health` - Versioned health check
- `GET /api/v1/admin/webhooks/stats` - Webhook processing statistics (Admin)
- `GET /api/v1/admin/webhooks/health` - Webhook system health (Admin)

### **🔐 Authentication**

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout current session
- `POST /api/v1/auth/logout-all` - Logout all sessions
- `GET /api/v1/auth/profile` - Get user profile
- `POST /api/v1/auth/change-password` - Change password

### **🔗 Social Authentication**

- `GET /api/v1/auth/oauth/google` - Initiate Google OAuth
- `GET /api/v1/auth/oauth/github` - Initiate GitHub OAuth
- `GET /api/v1/auth/oauth/google/callback` - Google OAuth callback
- `GET /api/v1/auth/oauth/github/callback` - GitHub OAuth callback
- `GET /api/v1/auth/oauth/accounts` - Get linked social accounts
- `DELETE /api/v1/auth/oauth/accounts/:provider` - Unlink social account

### **👥 Users**

- `GET /api/v1/users` - Get all users (with pagination, protected)
- `GET /api/v1/users/:id` - Get user by ID (protected)
- `PUT /api/v1/users/:id` - Update user (protected)
- `DELETE /api/v1/users/:id` - Delete user (protected)

### **💳 Billing & Subscriptions**

- `GET /api/v1/billing/plans` - Get available subscription plans
- `POST /api/v1/billing/checkout` - Create Stripe checkout session
- `POST /api/v1/billing/portal` - Create customer portal session
- `GET /api/v1/billing/subscription` - Get user's subscription & usage
- `POST /api/v1/billing/subscription/cancel` - Cancel subscription
- `POST /api/v1/billing/subscription/reactivate` - Reactivate subscription

### **🪝 Webhooks**

- `POST /webhooks/stripe` - Stripe webhook endpoint (public)

### **🛡️ Security**

- `GET /api/v1/csrf-token` - Get CSRF token

## 🎨 **UI Components**

The `@my/ui` package includes:

- **Button** - Customizable button component with variants
- **Utilities** - `cn()` function for class merging
- **More components** - Easy to add shadcn/ui components

## 🔧 **Configuration**

### **Database**

Update your database schema in `packages/database/prisma/schema.prisma`

### **Environment Variables**

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - API server port (default: 4000)
- `NODE_ENV` - Environment (development/production)
- `NEXT_PUBLIC_API_URL` - API URL for frontend
- `FRONTEND_URL` - Frontend URL for CORS

### **Adding New Packages**

1. Create new package in `packages/`
2. Add to `pnpm-workspace.yaml`
3. Update `tsconfig.base.json` paths
4. Import in apps using `@my/package-name`

## 🧪 **Features**

### **🏗️ Architecture**

- ✅ **Full-stack TypeScript** - Type safety across frontend and backend
- ✅ **Monorepo Structure** - Turbo + pnpm workspaces
- ✅ **Shared Packages** - Reusable UI, types, database, and utilities
- ✅ **ES Modules** - Modern JavaScript modules throughout

### **🔐 Authentication & Security**

- ✅ **JWT Authentication** - Access & refresh tokens with role-based permissions
- ✅ **Social OAuth** - Google & GitHub login with Passport.js
- ✅ **Multi-layer Security** - Helmet, CORS, CSRF protection, XSS sanitization
- ✅ **Rate Limiting** - Global and endpoint-specific rate limiting
- ✅ **Input Validation** - Zod schemas for request validation

### **💳 Payment & Billing**

- ✅ **Stripe Integration** - Checkout, subscriptions, customer portal
- ✅ **Webhook Handling** - Robust payment event processing with retries
- ✅ **Subscription Management** - Multiple plans with usage tracking
- ✅ **Email Notifications** - Payment confirmations, failures, and alerts

### **🗄️ Database & ORM**

- ✅ **Prisma ORM** - Type-safe database access with PostgreSQL
- ✅ **Database Seeding** - Sample data for development
- ✅ **Schema Management** - Version-controlled database schema
- ✅ **Prisma Studio** - Visual database browser

### **🎨 Frontend & UI**

- ✅ **Next.js 14** - App Router with React 18
- ✅ **shadcn/ui** - Beautiful, accessible UI components
- ✅ **Tailwind CSS** - Utility-first styling with dark mode
- ✅ **Error Boundaries** - Graceful error handling
- ✅ **Loading States** - Professional loading components

### **🔧 Developer Experience**

- ✅ **Hot Reload** - Development hot reload for all apps
- ✅ **TypeScript Strict** - Maximum type safety
- ✅ **ESLint & Prettier** - Code quality and formatting
- ✅ **Environment Management** - Proper env file organization
- ✅ **API Versioning** - Clean API structure with v1 prefix

## 🚀 **Production Deployment**

1. **Build all apps**:

   ```bash
   pnpm build
   ```

2. **Set production environment variables**

3. **Run database migrations**:

   ```bash
   pnpm db:migrate
   ```

4. **Deploy using your preferred platform** (Vercel, Railway, etc.)

## 📚 **Next Steps**

To extend this boilerplate:

1. **Add Authentication** - JWT or session-based auth
2. **Add Testing** - Jest + React Testing Library
3. **Add CI/CD** - GitHub Actions workflows
4. **Add Docker** - Containerization setup
5. **Add More UI Components** - Extend the UI package
6. **Add API Documentation** - Swagger/OpenAPI docs
