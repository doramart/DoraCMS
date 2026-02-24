# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言规则

所有对话请使用简体中文回复。

## Project Overview

DoraCMS is a full-stack CMS built with EggJS 3.x (backend) + Vue 3 (frontend), managed as a pnpm monorepo. It supports both MongoDB and MariaDB via a Repository/Adapter pattern.

## Commands

### Development

```bash
pnpm install              # Install all workspace dependencies
pnpm dev                  # Start server + user-center
pnpm dev:all              # Start all projects in parallel
pnpm dev:server           # Backend only (port 8080)
pnpm dev:user-center      # User frontend (port 3000)
pnpm dev:admin-center     # Admin dashboard (port 5173)
```

### Build

```bash
pnpm build                # Build all projects
pnpm build:server
pnpm build:user-center
pnpm build:admin-center
```

### Code Quality

```bash
pnpm lint                 # Lint all projects
pnpm lint:server
pnpm lint:user-center
pnpm lint:admin-center
pnpm format               # Format all code (Prettier)
```

### Testing

```bash
pnpm test                 # Run all tests
pnpm --filter @doracms/sdk test   # Run tests for a specific package
```

### Database

```bash
pnpm db:init              # Initialize database
pnpm db:init:force        # Force reinitialize
```

### Workspace-scoped dependency management

```bash
pnpm --filter "./server" add <pkg>
pnpm --filter "./client/user-center" add <pkg>
pnpm --filter "./client/admin-center" add <pkg>
pnpm --filter @doracms/sdk add <pkg>
pnpm add -w <pkg>         # Add to root workspace
```

## Architecture

### Monorepo Structure

- `server/` — EggJS backend (CommonJS, Node >= 14)
- `client/user-center/` — Vue 3 + Vite 4 user frontend
- `client/admin-center/` — Vue 3 + TypeScript + Vite 6 admin dashboard (requires Node >= 18.20)
- `packages/cli/` — `doracms-cli` (published to npm)
- `packages/sdk-js/` — `@doracms/sdk` (planned)
- `packages/types/`, `packages/utils/` — shared types/utils (planned)

### Backend (EggJS)

EggJS follows a layered convention: `router → controller → service → repository → model`.

- `server/app/controller/` — request handlers
- `server/app/service/` — business logic
- `server/app/repository/` — database abstraction layer (see below)
- `server/app/model/` — Mongoose/Sequelize model definitions
- `server/app/middleware/` — 20+ middleware files (auth, locale detection, rate limiting, etc.)
- `server/app/permission/` — RBAC permission definitions
- `server/config/config.default.js` — main config (reads from `config/env.js`)
- `server/config/locale/` — i18n keys (`common.*`, `template.*`, `mail.*`)
- `server/lib/plugin/` — custom EggJS plugins (`egg-ai-assistant`, `egg-dora-validate`, `egg-dora-middlestage`)

### Repository/Adapter Pattern

The server uses a database-agnostic repository layer to support both MongoDB and MariaDB:

```
Service → IRepository (interface) → BaseStandardRepository → MongoDB/MariaDB Adapter
```

- `server/app/repository/interfaces/` — `IBaseRepository.js`, `IStandardParams.js`
- `server/app/repository/base/BaseStandardRepository.js` — shared CRUD logic
- `server/app/repository/adapters/mongodb/` — Mongoose implementations
- `server/app/repository/adapters/mariadb/` — Sequelize implementations
- `server/app/repository/utils/EnhancedDataTransformer.js` — handles `_id` ↔ `id` mapping between DBs

Query parameters use a Strapi-style format: `filters`, `populate`, `sort`, `pagination`. The active database type is set via `config.repository.databaseType` (`'mongodb'` or `'mariadb'`).

### Frontend Architecture

Both `user-center` and `admin-center` use Vue 3 + Pinia + Element Plus. `admin-center` is based on SoybeanAdmin and uses UnoCSS + Sass. `user-center` integrates Qiankun for micro-frontend support.

### Internationalization

The server's `localeDetector` middleware auto-detects locale from URL, Cookie, and `Accept-Language` header, storing it in session. All API responses use i18n keys defined in `server/config/locale/`.

### Docker

`docker-compose.yml` uses profiles to compose services:
- Default: MongoDB
- `--profile mariadb`: MariaDB instead
- `--profile redis`: add Redis cache
- `--profile nginx`: add Nginx reverse proxy
- `--profile full`: MongoDB + Redis + Nginx

Copy `docker.env.example` to `.env` and set `APP_KEYS`, `SESSION_SECRET`, and DB passwords before running.
