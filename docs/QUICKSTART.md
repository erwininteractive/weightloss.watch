# Weight Loss Tracker - Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- Node.js 20.x or higher
- Docker (for PostgreSQL)
- Git

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/wlt.git
cd wlt

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Start PostgreSQL (Docker)
npm run db:start

# 5. Run database migrations
npm run db:migrate

# 6. (Optional) Seed database with test data
npm run db:seed

# 7. Start development server
npm run dev
```

Visit **http://localhost:3000** in your browser!

## Test Login Credentials (After Seeding)

- **Email**: john@example.com | **Password**: Password123
- **Email**: jane@example.com | **Password**: Password123
- **Email**: mike@example.com | **Password**: Password123

## What You Get

### Features

- ✅ User authentication (JWT with refresh tokens)
- ✅ Weight tracking with charts
- ✅ Profile management with avatar upload
- ✅ Teams and social features
- ✅ Challenges and achievements
- ✅ Progress photos
- ✅ Dark mode support

### Tech Stack

- **Backend**: TypeScript, Express.js, EJS templates
- **Database**: PostgreSQL 16, Prisma ORM
- **Frontend**: TailwindCSS 4, Alpine.js, Chart.js
- **Auth**: JWT tokens, bcrypt
- **File Uploads**: Multer
- **Testing**: Jest, Supertest

## Development Commands

### Database
```bash
npm run db:start       # Start PostgreSQL container
npm run db:stop        # Stop PostgreSQL container
npm run db:migrate     # Create and run migration
npm run db:push        # Push schema changes (dev only)
npm run db:studio      # Open Prisma Studio (GUI)
npm run db:seed        # Seed with test data
```

### Application
```bash
npm run dev            # Start with hot reload + CSS watch
npm run dev:server     # Start server only (no CSS watch)
npm run css:watch      # Watch Tailwind CSS changes
npm run css:build      # Build CSS once
```

### Testing
```bash
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
```

### Code Quality
```bash
npm run lint           # Run ESLint
npm run format         # Format with Prettier
```

### Build
```bash
npm run build          # Build for production
npm start              # Run production build
```

## Project Structure

```
src/
├── controllers/       # Request handlers
│   ├── AuthController.ts
│   ├── DashboardController.ts
│   ├── ProfileController.ts
│   ├── TeamController.ts
│   └── WeightController.ts
├── routes/            # Route definitions
├── views/             # EJS templates
│   ├── layout.ejs    # Main layout
│   ├── auth/         # Login, register
│   ├── dashboard/    # Dashboard
│   ├── profile/      # Profile pages
│   ├── teams/        # Team features
│   └── weight/       # Weight tracking
├── middleware/        # Custom middleware
├── services/          # Business logic
├── config/            # Configuration
└── server.ts          # Application entry

prisma/
├── schema.prisma      # Database schema
├── migrations/        # Database migrations
└── seed.ts            # Seed data

public/
├── dist/              # Built CSS
└── uploads/           # User uploads
    ├── avatars/
    └── progress/
```

## Common Tasks

### Add a New Route

1. Create controller in `src/controllers/`
2. Create route file in `src/routes/`
3. Register in `src/routes/index.ts`
4. Create view in `src/views/`

### Modify Database Schema

1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate`
3. Name your migration
4. Prisma client auto-regenerates

### Add Authentication to Route

```typescript
import { webAuthenticate } from '../middleware/webAuth';

router.get('/protected', webAuthenticate, Controller.method);
```

### Create a Form

```ejs
<form action="/endpoint" method="POST">
  <input type="text" name="field" required>
  <button type="submit">Submit</button>
</form>
```

## Environment Variables

Create `.env` file with:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database (Docker)
DATABASE_URL="postgresql://devuser:devpassword@localhost:5433/devdb?schema=public"

# JWT Secrets
JWT_ACCESS_SECRET="your-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
```

## Troubleshooting

### Port 3000 Already in Use
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps | grep wlt-db-dev

# Restart if needed
npm run db:stop && npm run db:start
```

### Missing Dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### CSS Not Building
```bash
# Rebuild CSS
npm run css:build
```

### Prisma Client Issues
```bash
# Regenerate Prisma client
npm run db:generate
```

## Next Steps

1. ✅ Explore the codebase
2. ✅ Review `CLAUDE.md` for development patterns
3. ✅ Check `TESTING.md` for testing guide
4. ✅ Read `docs/DEPLOYMENT.md` for production setup
5. ✅ Customize the application for your needs!

## Documentation

- **CLAUDE.md** - Development guide and patterns
- **TESTING.md** - Testing guide
- **docs/DEPLOYMENT.md** - Production deployment
- **docs/SERVER_CONFIG.md** - Server configuration
- **docs/DATA_PERSISTENCE.md** - Data persistence

## Support

- Check documentation first
- Review error logs: `pm2 logs` or console
- Test database connection
- Verify environment variables

Happy coding! 🚀
