# EggCMS - Modern CMS System Based on EggJS + Vue3

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-orange.svg)](https://pnpm.io/)

> 📦 **GitHub**: [doramart/DoraCMS](https://github.com/doramart/DoraCMS) | 📖 **Documentation**: [www.doracms.net](https://www.doracms.net) | 🇨🇳 **中文**: [README.md](./README.md)

A modern content management system based on EggJS 3.x + Vue 3 + TypeScript, managed with pnpm monorepo architecture.

## 🔗 Live Demo

- Frontend: [https://demo.doracms.net](https://demo.doracms.net)
- Admin: [https://demo.doracms.net/admin-center](https://demo.doracms.net/admin-center)
- Admin login: username `doracms` password `Hello985`

## 📸 Screenshots

### Admin Center

![Admin Center](https://cdn.html-js.cn/cms/uploadfiles/images/admin-center.png)

### User Center

![User Center](https://cdn.html-js.cn/cms/uploadfiles/images/user-center.png)

### Content Management

![Content Management](https://cdn.html-js.cn/cms/uploadfiles/images/content-manage.png)

### AI Content Publishing

![AI Content Publishing](https://cdn.html-js.cn/cms/uploadfiles/images/ai-content.png)

### Model Management

![Model Management](https://cdn.html-js.cn/cms/uploadfiles/images/model-manage.png)

### Home Page

![Home Page](https://cdn.html-js.cn/cms/uploadfiles/images/home-page.png)

## 🏗️ Project Architecture

This project uses a monorepo architecture with three main modules:

```
egg-cms/
├── server/                    # EggJS backend service
├── client/
│   ├── user-center/          # Vue3 user frontend
│   └── admin-center/         # Vue3 + TypeScript admin center
└── package.json              # Root configuration
```

## 🛠️ Tech Stack

### Backend (Server)

- **Framework**: EggJS 3.x
- **Database**: MongoDB + Mongoose / MariaDB + Sequelize (dual database support)
- **Authentication**: JWT
- **Cache**: Redis (optional)
- **File Upload**: Supports Alibaba Cloud OSS, Qiniu Cloud
- **Deployment**: Docker + Docker Compose

### Frontend (User Center)

- **Framework**: Vue 3 + Composition API
- **Build Tool**: Vite 4.x
- **UI Library**: Element Plus
- **State Management**: Pinia
- **Internationalization**: Vue i18n

### Admin Center

- **Framework**: Vue 3 + TypeScript
- **Build Tool**: Vite 6.x
- **UI Library**: Element Plus
- **Styling**: UnoCSS + Sass
- **State Management**: Pinia
- **Charts**: Echarts, @antv/g2
- **Rich Text Editor**: @wangeditor/editor

## 🌍 Internationalization

- The server enables the `localeDetector` middleware, automatically selecting the language based on URL, Cookie, and `Accept-Language`, and syncing to session.
- All admin APIs use unified internationalization keys (`common.*`, `template.*`, `mail.*`, etc.), which can be extended in `server/config/locale`.
- Nunjucks filters and date utilities read the current request's `ctx.locale` to keep page rendering consistent with API responses.

## 🚀 Quick Start

### Requirements

#### Local Development

- Node.js >= 14.0.0 (recommended 18.x)
- pnpm >= 8.0.0
- MongoDB or MariaDB
- Redis (optional)

#### Docker Deployment

- Docker >= 20.10
- Docker Compose >= 2.0

### Install Dependencies

```bash
# Clone the project
git clone https://github.com/doramart/DoraCMS.git
cd DoraCMS

# Install all project dependencies
pnpm install
```

### Development Mode

```bash
# Start server and user frontend together
pnpm dev

# Start all projects (in parallel)
pnpm dev:all

# Start projects individually
pnpm dev:server       # Start backend service (port: 7001)
pnpm dev:user-center  # Start user frontend (port: 3000)
pnpm dev:admin-center # Start admin center (port: 5173)
```

### Production Build

```bash
# Build all projects
pnpm build

# Build individually
pnpm build:server
pnpm build:user-center
pnpm build:admin-center
```

## 📝 Available Scripts

### Development

- `pnpm dev` - Start server + user frontend
- `pnpm dev:all` - Start all projects in parallel
- `pnpm dev:server` - Start backend service only
- `pnpm dev:user-center` - Start user frontend only
- `pnpm dev:admin-center` - Start admin center only

### Build

- `pnpm build` - Build all projects
- `pnpm build:server` - Build backend
- `pnpm build:user-center` - Build user frontend
- `pnpm build:admin-center` - Build admin center

### Code Quality

- `pnpm lint` - Lint all project code
- `pnpm lint:server` - Lint backend code
- `pnpm lint:user-center` - Lint user frontend code
- `pnpm lint:admin-center` - Lint admin center code
- `pnpm format` - Format all code

### Cleanup

- `pnpm clean` - Clean all node_modules
- `pnpm clean:server` - Clean backend dependencies
- `pnpm clean:user-center` - Clean user frontend dependencies
- `pnpm clean:admin-center` - Clean admin center dependencies

### Plugin Management

- `pnpm plugin:install` - Install server plugins
- `pnpm plugin:build` - Build plugins
- `pnpm plugin:clean` - Clean plugins

## 🌐 Access URLs

### Development Mode

- **User Frontend**: http://localhost:3000
- **Admin Center**: http://localhost:5173
- **Backend API**: http://localhost:7001

### Docker Deployment

- **Application**: http://localhost:8080
- **Admin Center**: http://localhost:8080/admin
- **API**: http://localhost:8080/api

## 🐳 Docker Deployment

> 📖 **Complete Deployment Guide**: [Docker Deployment Guide](https://www.doracms.net/deployment/docker)

### Quick Start

```bash
# 1. Clone the project
git clone https://github.com/doramart/DoraCMS.git
cd DoraCMS

# 2. Use the quick start script
./docker-quickstart.sh

# Or use Docker Compose
docker compose up -d
```

### Database Selection

#### Using MongoDB (Default)

```bash
# Start MongoDB mode
docker compose up -d

# View logs
docker compose logs -f eggcms-app
```

#### Using MariaDB

```bash
# Start MariaDB mode
docker compose --profile mariadb up -d

# View logs
docker compose logs -f eggcms-app-mariadb
```

### Optional Components

```bash
# Enable Redis cache
docker compose --profile redis up -d

# Enable Nginx reverse proxy
docker compose --profile nginx up -d

# Full stack (MongoDB + Redis + Nginx)
docker compose --profile full up -d

# Full stack (MariaDB + Redis + Nginx)
docker compose --profile mariadb --profile redis --profile nginx up -d
```

### Configure Environment Variables

```bash
# Copy environment variable template
cp docker.env.example .env

# Edit configuration (important: modify security-related settings)
vim .env
```

**⚠️ Configuration that must be modified in production:**

- `APP_KEYS` - Application secret key
- `SESSION_SECRET` - Session secret
- Database password

Generate random keys:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

> 💡 **Tip**: For more detailed Docker deployment instructions, data persistence, health checks, troubleshooting, etc., please refer to the [Complete Docker Deployment Guide](https://www.doracms.net/deployment/docker)

## 📚 More Documentation

- [Docker Deployment Guide](https://www.doracms.net/deployment/docker) - Complete Docker deployment documentation (recommended)
- [Docker Deployment Guide (Local)](./DOCKER_DEPLOYMENT.md) - Local Docker deployment documentation
- [Development Guide](./MONOREPO_GUIDE.md) - Local development and project structure
- [Database Migration Guide](./DATABASE_MIGRATION.md) - MongoDB ↔ MariaDB migration
- [Repository Pattern](./server/app/repository/README.md) - Database adapter layer documentation
- [SoybeanAdmin](https://docs.soybeanjs.cn/zh/) - Admin center is based on SoybeanAdmin with custom development

## 🤝 Contributing

Pull Requests and Issues are welcome!

## 💬 Community & Support

Join our community to discuss and learn with other developers:

<img width="450" src="http://cdn.html-js.cn/contactbywechatqq1.jpg" alt="Community Group">

## 📄 License

MIT License

---

## 🔧 FAQ

### Q: How to add dependencies for a specific project?

```bash
# Add dependency for server
pnpm --filter "./server" add package-name

# Add dependency for user frontend
pnpm --filter "./client/user-center" add package-name

# Add dependency for admin center
pnpm --filter "./client/admin-center" add package-name
```

### Q: How to resolve dependency conflicts?

```bash
# Clean all dependencies and reinstall
pnpm clean
pnpm install
```

### Q: What if Node.js version is incompatible?

admin-center requires Node.js >= 18.20.0. If the version is incompatible, use nvm to switch versions:

```bash
nvm use 18
# or
nvm install 18.20.0
nvm use 18.20.0
```

## Code Standards

The project uses ESLint and Prettier for code quality checks and formatting. lint-staged will automatically run checks when committing code.
