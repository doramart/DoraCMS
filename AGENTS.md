# Repository Guidelines

## Project Structure & Module Organization
CMS3 is a pnpm workspace: `server/` (Egg.js API plus Nunjucks views in `app/view`), `client/user-center/` (Vue 3 dashboard, assets in `src/assets`), and shared helpers/scripts in `scripts/`. Docker files live in `docker/` and the root Docker* manifests, while repo-level fixtures or seed data sit under `/test`. Add new functionality next to its layer (controller/service/model under `server/app`, UI modules under `client/user-center/src/modules`) to keep dependency wiring predictable.

## Build, Test, and Development Commands
- `pnpm install` – install all workspaces (Node >=14, pnpm >=8).
- `pnpm run dev:server` / `pnpm run dev:user-center` / `pnpm run dev:all` – start the Egg API, the Vite admin, or both in parallel.
- `pnpm run build:server`, `pnpm run build:user-center`, or `pnpm run build` – produce deployable artifacts.
- `pnpm run lint` – ESLint + Prettier across workspaces (same command invoked by Husky).
- `pnpm --filter "./server" run test` or `run cov` – backend unit suite and coverage.

## Coding Style & Naming Conventions
ESLint presets (`eslint-config-egg`, `eslint-plugin-vue`) plus Prettier enforce 2-space indent, single quotes, trailing commas, and normalized imports. Name files in kebab-case, Vue components in PascalCase, and services/stores in camelCase; keep API routes lowercase-hyphenated (e.g., `/api/v1/ad-slot`). Run `pnpm run lint` or `pnpm run format` before sending reviews; lint-staged will block commits that fail the rule set.

## Testing Guidelines
Unit and functional specs live with their targets (`server/test/controller/*.test.js`, `server/test/service/*.test.js`). Frontend specs belong under `client/**/__tests__` using Vitest + Vue Test Utils; mock network calls through the Axios adapter. Aim for ≥80 % line coverage on new backend modules, smoke-test UI changes locally, and use `/test` for e2e or migration scripts so Docker snapshots remain reproducible.

## Commit & Pull Request Guidelines
Git history favors short, present-tense summaries (e.g., `权限初步调整`, `配置更新`); follow that format and keep one logical change per commit. PRs should explain the change, link an issue, list verification commands, and attach UI screenshots or API samples when behavior shifts. Re-run `pnpm run lint` and the relevant `pnpm --filter "./server" run test` / Vite preview before pushing to keep CI noise low.

## Security & Configuration Tips
Create environment files from `server/env.example` or `docker.env.example` and never commit secrets. Keep uploads, plugins, and scheduled jobs inside `server/lib`, reuse the `parameter` validators, and log any Docker or runtime-port changes in `DOCKER_SETUP_SUMMARY.md` for operators.
