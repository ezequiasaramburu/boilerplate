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
ai-coach/
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
- PostgreSQL database

### **1. Clone & Install**

```bash
git clone <repository-url>
cd ai-coach
pnpm setup
```

### **2. Environment Setup**

```bash
# Copy environment file
cp env.example .env

# Update .env with your database URL and other configurations
DATABASE_URL="postgresql://username:password@localhost:5432/example_db"
```

### **3. Database Setup**

```bash
# Push database schema
pnpm db:push

# Generate Prisma client
pnpm db:generate

# (Optional) Open Prisma Studio
pnpm db:studio
```

### **4. Start Development**

```bash
pnpm dev
```

This starts:

- **API**: http://localhost:4000
- **Web**: http://localhost:3000

## 📝 **Available Scripts**

```bash
# Development
pnpm dev              # Start all apps in development mode
pnpm build            # Build all apps for production
pnpm lint             # Lint all packages
pnpm type-check       # Type check all packages

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run database migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database with sample data

# Setup
pnpm setup            # Install dependencies & generate Prisma client
```

## 🏗️ **API Endpoints**

### **Users**

- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### **Health Check**

- `GET /health` - API health check

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

- ✅ **Full-stack TypeScript** - Type safety across frontend and backend
- ✅ **Database ORM** - Prisma with PostgreSQL
- ✅ **API Validation** - Zod schemas for request validation
- ✅ **CORS & Security** - Production-ready security middleware
- ✅ **Error Handling** - Centralized error handling
- ✅ **Logging** - Request logging with Morgan
- ✅ **Hot Reload** - Development hot reload for all apps
- ✅ **Shared Components** - Reusable UI components across apps
- ✅ **ES Modules** - Modern JavaScript modules throughout

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
