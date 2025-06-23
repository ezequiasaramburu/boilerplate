# Enterprise Full-Stack Monorepo

A production-ready monorepo boilerplate built with TypeScript, featuring a Next.js frontend, Express.js API, PostgreSQL database, and comprehensive usage-based billing system.

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
- **Stripe** - Payment processing
- **JWT** - Authentication

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
├── .env                     # 🔑 Single environment file (root)
├── package.json             # 🎛️ Root orchestrator
├── turbo.json              # ⚡ Turbo configuration
├── tsconfig.base.json      # 📝 Base TypeScript config
├── pnpm-workspace.yaml     # 📦 Workspace configuration
├── apps/
│   ├── api/                # 🔧 Express.js API
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── index.ts
│   │   └── package.json
│   └── web/                # 🌐 Next.js frontend
│       ├── src/
│       ├── pages/
│       └── package.json
└── packages/
    ├── database/           # 🗄️ Prisma database
    │   ├── prisma/
    │   ├── src/
    │   └── package.json
    ├── types/              # 📋 Shared types
    ├── ui/                 # 🎨 UI components
    └── utils/              # 🛠️ Utilities
```

## 🛠️ **Quick Start**

### **Prerequisites**

- Node.js 18+
- pnpm
- PostgreSQL database

### **1. Clone & Install**

```bash
git clone <repository-url>
cd boilerplate
pnpm install
```

### **2. Environment Setup**

**🎯 Single Environment File Approach**

Create a single `.env` file in the project root:

```bash
# Copy the example file
cp env.example .env
```

**Edit `.env` with your actual values:**

```env
# =============================================================================
# DATABASE (Required)
# =============================================================================
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"

# =============================================================================
# API SERVER
# =============================================================================
PORT=4000
HOST=localhost
NODE_ENV=development

# Authentication (Required)
JWT_SECRET=your-super-secret-jwt-key-that-is-long-enough-for-security-purposes-64-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-that-is-long-enough-for-security-purposes-64-chars

# Stripe (Optional for development)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# =============================================================================
# WEB APP
# =============================================================================
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=Enterprise App
```

> **✅ Why Single .env?** All packages read from the root `.env` file. No more scattered environment files!

### **3. Database Setup**

```bash
# 1. Generate Prisma client
pnpm db:generate

# 2. Push schema to database
pnpm db:push

# 3. (Optional) Seed with sample data
pnpm db:seed

# 4. (Optional) Open database browser
pnpm db:studio
```

### **4. Start Development**

```bash
# Start everything (API + Web)
pnpm dev

# Or start individually
pnpm dev:api    # API only (http://localhost:4000)
pnpm dev:web    # Web only (http://localhost:3000)
```

### **5. Verify Setup**

- **API Health**: http://localhost:4000/health
- **Web App**: http://localhost:3000
- **Database**: http://localhost:5555 (if running `db:studio`)

## 📝 **Commands Reference**

### **🚀 Development Commands**

| Command          | Description    | Scope |
| ---------------- | -------------- | ----- |
| `pnpm dev`       | Start all apps | All   |
| `pnpm dev:api`   | Start API only | API   |
| `pnpm dev:web`   | Start web only | Web   |
| `pnpm build`     | Build all apps | All   |
| `pnpm build:api` | Build API only | API   |
| `pnpm build:web` | Build web only | Web   |

### **🗄️ Database Commands**

| Command            | Description             | Target   |
| ------------------ | ----------------------- | -------- |
| `pnpm db:generate` | Generate Prisma client  | Database |
| `pnpm db:push`     | Push schema to DB (dev) | Database |
| `pnpm db:migrate`  | Run migrations (prod)   | Database |
| `pnpm db:studio`   | Open database browser   | Database |
| `pnpm db:seed`     | Seed sample data        | Database |
| `pnpm db:reset`    | Reset database          | Database |
| `pnpm db:deploy`   | Deploy migrations       | Database |

### **🔧 Code Quality Commands**

| Command             | Description        | Scope |
| ------------------- | ------------------ | ----- |
| `pnpm lint`         | Lint all packages  | All   |
| `pnpm lint:fix`     | Fix linting issues | All   |
| `pnpm type-check`   | TypeScript check   | All   |
| `pnpm format`       | Format code        | All   |
| `pnpm format:check` | Check formatting   | All   |

### **📦 Package Management**

| Command            | Description               | Scope |
| ------------------ | ------------------------- | ----- |
| `pnpm install`     | Install dependencies      | All   |
| `pnpm setup`       | Full setup (install + db) | All   |
| `pnpm reset`       | Clean + install + db      | All   |
| `pnpm clean`       | Clean build artifacts     | All   |
| `pnpm deps:check`  | Check for vulnerabilities | All   |
| `pnpm deps:update` | Update dependencies       | All   |

### **🎯 Individual Package Commands**

```bash
# Work directly with specific packages
cd apps/api
pnpm dev              # Start API server
pnpm build            # Build API
pnpm lint             # Lint API code

cd apps/web
pnpm dev              # Start web app
pnpm build            # Build web app
pnpm lint             # Lint web code

cd packages/database
pnpm generate         # Generate Prisma client
pnpm push             # Push schema to DB
pnpm studio           # Open Prisma Studio
```

## 🏗️ **Architecture Overview**

### **🎛️ Monorepo Structure**

- **Root `package.json`**: Orchestrates all commands using Turbo
- **Individual `package.json`**: Each package manages its own dependencies
- **Turbo**: Handles caching, parallelization, and task dependencies
- **pnpm Workspaces**: Manages package linking and installation

### **🔄 Command Flow**

```
Root Command → Turbo → Individual Package → Actual Tool
pnpm db:push → turbo run push --filter=@my/database → cd packages/database && pnpm push → prisma db push
```

### **🌍 Environment Variables**

- **Single Source**: Root `.env` file
- **Turbo Integration**: `globalEnv` ensures cache invalidation
- **Package Access**: All packages read from root `.env`
- **No Duplication**: No scattered `.env` files

## 🧪 **Features**

### **🏗️ Architecture**

- ✅ **Monorepo Structure** - Turbo + pnpm workspaces
- ✅ **Shared Packages** - Reusable UI, types, database utilities
- ✅ **Type Safety** - End-to-end TypeScript
- ✅ **Modern ES Modules** - Latest JavaScript standards

### **🔐 Authentication & Security**

- ✅ **JWT Authentication** - Access & refresh tokens
- ✅ **Social OAuth** - Google & GitHub integration
- ✅ **Role-based Access** - User permissions system
- ✅ **Security Middleware** - Helmet, CORS, CSRF, rate limiting

### **💳 Billing & Usage Tracking**

- ✅ **Stripe Integration** - Complete payment processing
- ✅ **Usage-based Billing** - Track multiple metrics
- ✅ **Subscription Management** - Multiple plans and tiers
- ✅ **Real-time Alerts** - Usage threshold notifications
- ✅ **Webhook Processing** - Robust event handling

### **🗄️ Database**

- ✅ **Prisma ORM** - Type-safe database access
- ✅ **PostgreSQL** - Production-ready database
- ✅ **Migration System** - Version-controlled schema
- ✅ **Seeding** - Sample data for development

### **🎨 Frontend**

- ✅ **Next.js 14** - Latest React framework
- ✅ **shadcn/ui** - Beautiful, accessible components
- ✅ **Tailwind CSS** - Utility-first styling
- ✅ **Error Boundaries** - Graceful error handling

### **🔧 Developer Experience**

- ✅ **Hot Reload** - Fast development feedback
- ✅ **Parallel Builds** - Turbo-powered performance
- ✅ **Code Quality** - ESLint, Prettier, TypeScript strict
- ✅ **Environment Management** - Centralized configuration

## 🚀 **Production Deployment**

### **1. Build**

```bash
pnpm build
```

### **2. Environment**

Set production environment variables in your deployment platform.

### **3. Database**

```bash
pnpm db:deploy  # Run production migrations
```

### **4. Deploy**

Deploy to your preferred platform (Vercel, Railway, Docker, etc.)

## 📚 **API Documentation**

API documentation is available through:

- **Swagger/OpenAPI** (coming soon)
- **Postman Collection** (coming soon)
- **Interactive API Explorer** (coming soon)

> **Note**: API endpoints are not documented in README to maintain clean separation of concerns. Use proper API documentation tools instead.

## 🔧 **Configuration**

### **Adding New Packages**

1. Create package in `packages/`
2. Add to `pnpm-workspace.yaml`
3. Update `tsconfig.base.json` paths
4. Import using `@my/package-name`

### **Environment Variables**

All environment variables are managed in the root `.env` file. See `env.example` for all available options.

### **Database Schema**

Update schema in `packages/database/prisma/schema.prisma`, then run:

```bash
pnpm db:push      # Development
pnpm db:migrate   # Production
```

## 🤝 **Contributing**

1. **Setup**: `pnpm setup`
2. **Develop**: `pnpm dev`
3. **Lint**: `pnpm lint:fix`
4. **Type Check**: `pnpm type-check`
5. **Test**: `pnpm test` (when implemented)

## 📄 **License**

MIT License - see LICENSE file for details.
