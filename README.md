# WeighTogether

A full-featured weight loss tracking application with social features, built with TypeScript, Express, and PostgreSQL.

![Build Status](https://github.com/your-username/wlt/actions/workflows/deploy.yml/badge.svg)

## Features

- **Weight Tracking** - Log weight entries with body composition metrics
- **Progress Photos** - Upload and track visual progress
- **Social Features** - Teams, posts, comments, and likes
- **Challenges** - Team and global weight loss challenges
- **Achievements** - Milestone tracking and badges
- **Charts & Analytics** - Visual progress tracking with Chart.js
- **Dark Mode** - Built-in theme support
- **Authentication** - JWT-based auth with refresh tokens
- **File Uploads** - Profile avatars and progress photos
- **Responsive Design** - TailwindCSS 4 with mobile support

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

Visit **http://localhost:3000** in your browser!

### Test Login (After Seeding)

- Email: john@example.com
- Password: Password123

## Tech Stack

- **Backend**: TypeScript, Express.js, EJS templates
- **Database**: PostgreSQL 16, Prisma ORM 7
- **Frontend**: TailwindCSS 4, Alpine.js, Chart.js
- **Authentication**: JWT tokens with refresh tokens
- **File Uploads**: Multer
- **Testing**: Jest, Supertest
- **Process Management**: PM2 (production)
- **CI/CD**: GitHub Actions

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

## Documentation

- **[QUICKSTART.md](./docs/QUICKSTART.md)** - Quick setup guide
- **[TESTING.md](./docs/TESTING.md)** - Testing guide
- **[REQUIREMENTS.md](./docs/REQUIREMENTS.md)** - Technical requirements
- **[STYLE_GUIDE.md](./docs/STYLE_GUIDE.md)** - UI/UX styling conventions

## Project Structure

```
src/
├── controllers/       # Request handlers
├── routes/            # Route definitions
├── views/             # EJS templates
├── middleware/        # Custom middleware
├── services/          # Business logic
├── config/            # Configuration
└── server.ts          # Application entry

prisma/
├── schema.prisma      # Database schema
├── migrations/        # Database migrations
└── seed.ts            # Seed data

tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── helpers/           # Test utilities

public/
├── dist/              # Built CSS
└── uploads/           # User uploads
    ├── avatars/
    └── progress/
```

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

## License

MIT - See [LICENSE](./LICENSE) for details.

---

**Built with TypeScript, Express, and PostgreSQL**
