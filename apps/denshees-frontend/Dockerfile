FROM node:lts-alpine

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy workspace config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy package.json files for all workspace packages
COPY apps/denshees-frontend/package.json apps/denshees-frontend/
COPY packages/database/package.json packages/database/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/database/ packages/database/
COPY apps/denshees-frontend/ apps/denshees-frontend/

# Generate Prisma client
RUN pnpm --filter @denshees/database db:generate

# Build Next.js app
WORKDIR /app/apps/denshees-frontend
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
