# PontoCerto - Employee Time Tracking System

## Overview

PontoCerto (branded as "Olivium Sistemas - Gestão de Ponto") is a full-stack employee time tracking system designed for small to medium businesses. The application allows employees to clock in/out and administrators to manage users and generate reports. It features a React frontend with a Node.js/Express backend, using SQLite for local data storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite

The frontend follows a component-based architecture with:
- Protected routes that check authentication status
- Role-based access control (admin vs employee views)
- Custom hooks for API interactions (`use-auth`, `use-points`, `use-users`)
- Centralized API route definitions in `shared/routes.ts`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (compiled with tsx)
- **Authentication**: Passport.js with Local Strategy + express-session
- **Session Storage**: Memory store (memorystore package)

The server uses a modular structure:
- `server/index.ts`: Application entry point and middleware setup
- `server/routes.ts`: API route definitions
- `server/auth.ts`: Authentication configuration
- `server/storage.ts`: Data access layer abstraction
- `server/db.ts`: Database connection and schema initialization

### Data Storage
- **Database**: SQLite via better-sqlite3 (local file: `sqlite.db`)
- **ORM**: Drizzle ORM with SQLite dialect
- **Schema Validation**: Zod with drizzle-zod integration

Note: The drizzle.config.ts references PostgreSQL, but the actual implementation uses SQLite. The PostgreSQL configuration exists for potential future migration or Replit deployment.

### Key Design Patterns
1. **Shared Types**: Schema definitions in `shared/schema.ts` are used by both frontend and backend
2. **API Contract**: Route definitions with Zod validation in `shared/routes.ts`
3. **Storage Abstraction**: `IStorage` interface allows swapping storage implementations
4. **Session-based Auth**: Cookie-based authentication with credentials included in requests

## External Dependencies

### Database
- **SQLite**: Local file-based database (`sqlite.db`)
- **Drizzle ORM**: Database queries and schema management

### Authentication
- **Passport.js**: Authentication middleware
- **passport-local**: Username/password strategy
- **express-session**: Session management
- **memorystore**: In-memory session storage

### Frontend Libraries
- **@tanstack/react-query**: Server state management
- **date-fns**: Date formatting and manipulation
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling

### Build & Development
- **Vite**: Frontend build tool with HMR
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Production bundling for server
- **cross-env**: Cross-platform environment variables

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development banner