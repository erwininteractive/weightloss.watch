# WeighTogether

A full-featured weight loss tracking application with social features, built with TypeScript, Express, and PostgreSQL.

![Build Status](https://github.com/erwininteractive/weightloss.watch/actions/workflows/deploy.yml/badge.svg)

## Features

### Core Tracking

- **Weight Tracking** - Log weight entries with body composition metrics (body fat %, muscle mass, measurements)
- **Progress Photos** - Upload and attach photos to weight entries
- **Charts & Analytics** - Visual progress tracking with interactive Chart.js graphs
- **Unit System** - Support for both Imperial (lbs/inches) and Metric (kg/cm) units

### Social Features

- **Teams** - Create and join teams for collaborative tracking
- **Posts** - Share updates, milestones, tips, and motivation
- **Comments & Likes** - Engage with community posts
- **Team Roles** - Owner, Admin, Moderator, and Member permissions
- **Privacy Controls** - Private, team-only, or public weight entries

### Challenges & Achievements

- **Challenges** - Team-based and global weight loss challenges
- **Challenge Types** - Weight loss, consistency, muscle gain, body fat reduction
- **Achievements** - Milestone tracking and badges (5 lbs lost, 10 lbs lost, etc.)
- **Leaderboards** - Track progress within teams and challenges

### User Experience

- **Authentication** - JWT-based auth with refresh tokens and email verification
- **Password Reset** - Email-based password recovery
- **Profile Management** - Customizable profiles with avatars and personal info
- **Responsive Design** - Mobile-first design with TailwindCSS 4
- **Birthday Tracking** - Optional birthday field for personalized experience

### Administration

- **Admin Panel** - Comprehensive user and content management
- **User Management** - View, edit, suspend, and manage user accounts
- **Password Reset** - Admin-initiated password resets
- **Email Verification** - Resend verification emails for users
- **Activity Monitoring** - Track user activity and system health

## Quick Start

See [QUICKSTART.md](./docs/QUICKSTART.md) for detailed setup instructions.

### Prerequisites

- Node.js 20.x or higher
- Docker (for PostgreSQL in development)
- Git

### Installation

```bash
# 1. Clone repository
git clone https://github.com/andrewthecodertx/weightloss.watch.git
cd weightloss.watch

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Start PostgreSQL (Docker)
npm run db:start

# 5. Run database migrations
npm run db:migrate

# 6. Seed database (optional)
npm run db:seed

# 7. Start development server
npm run dev
```

Visit **<http://localhost:3000>** in your browser!

### Test Login (After Seeding)

- Email: <john@example.com>
- Password: Password123

## Tech Stack

### Backend

- **Runtime**: Node.js 20.x with TypeScript
- **Framework**: Express.js (server-side MVC)
- **Template Engine**: EJS with express-ejs-layouts
- **Database**: PostgreSQL 16 with Prisma ORM 7
- **Authentication**: JWT tokens (access + refresh) with bcrypt
- **Email**: Nodemailer with SMTP support
- **File Uploads**: Multer middleware
- **Validation**: express-validator

### Frontend

- **CSS Framework**: TailwindCSS 4 (processed with Vite)
- **JavaScript**: Alpine.js for reactive components
- **Charts**: Chart.js for data visualization
- **Icons**: Lucide icons

### Development & Deployment

- **Testing**: Jest with Supertest for integration tests
- **Code Quality**: ESLint + Prettier
- **Process Management**: PM2 (production)
- **CI/CD**: GitHub Actions
- **Web Server**: Nginx (production reverse proxy)

### Database Architecture

- **ORM**: Prisma Client 7 with PostgreSQL adapter
- **Migrations**: Prisma Migrate
- **Soft Deletes**: Timestamp-based (deletedAt field)
- **Relations**: User → Teams, Posts, WeightEntries, Challenges

## Development Commands

### Database

```bash
npm run db:start       # Start PostgreSQL container
npm run db:stop        # Stop PostgreSQL container
npm run db:migrate     # Create and run migration
npm run db:push        # Push schema changes (dev only)
npm run db:studio      # Open Prisma Studio (GUI)
npm run db:seed        # Seed with test data
npm run db:generate    # Regenerate Prisma client
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
npm run test:unit      # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:ci        # Run tests in CI mode
```

### Code Quality

```bash
npm run lint           # Run ESLint
npm run format         # Format with Prettier
```

### Build & Production

```bash
npm run build          # Build CSS + compile TypeScript + generate Prisma client
npm start              # Run production build
```

### Admin & Utilities

```bash
npm run create-admin   # Promote user to admin by email
```

## Documentation

### Getting Started

- **[QUICKSTART.md](./docs/QUICKSTART.md)** - Quick setup guide
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Production deployment guide

### Development

- **[TESTING.md](./docs/TESTING.md)** - Testing guide and best practices
- **[REQUIREMENTS.md](./docs/REQUIREMENTS.md)** - Technical requirements
- **[STYLE_GUIDE.md](./docs/STYLE_GUIDE.md)** - UI/UX styling conventions

## Project Structure

```
src/
├── controllers/       # Request handlers (MVC controllers)
│   ├── AuthController.ts
│   ├── WebAuthController.ts
│   ├── DashboardController.ts
│   ├── TeamController.ts
│   ├── ChallengeController.ts
│   └── AdminController.ts
├── routes/            # Route definitions
│   ├── authRoutes.ts
│   ├── webAuthRoutes.ts
│   ├── dashboardRoutes.ts
│   ├── teamRoutes.ts
│   └── adminRoutes.ts
├── views/             # EJS templates
│   ├── layout.ejs     # Main layout
│   ├── auth/          # Login, register, verify email
│   ├── dashboard/     # Dashboard views
│   ├── teams/         # Team management views
│   └── admin/         # Admin panel views
├── middleware/        # Custom middleware
│   ├── auth.ts        # API authentication (JWT)
│   ├── webAuth.ts     # Web authentication (cookies)
│   ├── loadUser.ts    # User context loader
│   ├── upload.ts      # File upload (Multer)
│   └── errorHandler.ts
├── services/          # Business logic
│   ├── auth.service.ts
│   ├── email.service.ts
│   └── database.ts    # Prisma client
├── config/            # Configuration
│   └── auth.ts        # JWT config
├── types/             # TypeScript types
└── server.ts          # Application entry point

prisma/
├── schema.prisma      # Database schema (models, enums, relations)
├── migrations/        # Database migration history
└── seed.ts            # Seed data for development

tests/
├── setup.ts           # Global test configuration
├── helpers/           # Test utilities and factories
├── unit/              # Unit tests for services
└── integration/       # Integration tests for routes

scripts/
├── create-admin.ts    # Promote user to admin
├── test-smtp.ts       # SMTP diagnostic tool
└── diagnose-smtp-firewall.sh  # Network diagnostic tool

public/
├── dist/              # Built CSS (generated by Vite)
└── uploads/           # User-uploaded files
    ├── avatars/       # Profile pictures
    └── progress/      # Progress photos
```

## Architecture

### MVC Pattern

- **Models**: Defined in `prisma/schema.prisma` (User, Team, Post, Challenge, etc.)
- **Views**: EJS templates in `src/views/` with layouts
- **Controllers**: Request handlers in `src/controllers/`

### Authentication Flow

1. User registers → Email verification sent
2. User verifies email → Account activated
3. User logs in → Access token (15 min) + Refresh token (7 days)
4. Access token expires → Auto-refresh via refresh token
5. Tokens stored in HTTP-only cookies for security

### Database Models

- **User** - Authentication, profile, preferences
- **Team** - Groups for collaborative tracking
- **TeamMember** - User-team relationships with roles
- **WeightEntry** - Weight logs with body metrics
- **ProgressPhoto** - Photos attached to weight entries
- **Post** - Social posts (general, milestone, tip, etc.)
- **Comment** - Comments on posts
- **Challenge** - Weight loss challenges
- **RefreshToken** - JWT refresh token storage

## Contributing

**We're actively looking for contributors!** WeighTogether is a free and open source project, and we welcome contributions of all kinds.

### Ways to Contribute

- **Code**: Fix bugs, add features, improve performance
- **Documentation**: Improve README, add guides, fix typos
- **Design**: UI/UX improvements, accessibility enhancements
- **Testing**: Write tests, report bugs, suggest improvements
- **Translations**: Help make the app accessible worldwide

### Getting Started

1. Fork the repository
2. Clone your fork and set up the development environment (see Quick Start above)
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests: `npm test`
6. Run linter: `npm run lint`
7. Submit a pull request with a clear description of your changes

### Good First Issues

New to the project? Look for issues labeled `good first issue` on GitHub - these are great starting points for new contributors.

### Code of Conduct

Please be respectful and inclusive. We want this to be a welcoming community for everyone.

## Environment Variables

Required variables in `.env`:

```bash
# Server
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5433/wlt?schema=public"

# JWT Secrets (generate with: openssl rand -base64 48)
JWT_ACCESS_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Email (SMTP)
SMTP_HOST="mail.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
SMTP_FROM="WeighTogether <noreply@example.com>"
```

See `.env.example` for full configuration options.

## License

MIT - See [LICENSE](./LICENSE) for details.

---

**Built with TypeScript, Express, PostgreSQL, and Alpine.js**
