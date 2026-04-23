# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# School Wave Studios — multi-stage Next.js standalone build.
#
# Using node:24-slim (Debian-based, glibc) rather than alpine because
# better-sqlite3 ships prebuilt binaries for glibc but not for musl — the
# slim image "just works" while alpine would require compiling from source.
#
# The final runner image also carries the generated Drizzle migration files
# (./drizzle) because src/instrumentation.ts applies them on startup.
# ─────────────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=24-slim

# ─── 1) Install dependencies (cached layer) ────────────────────────────────
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN corepack enable
# Build tools in case better-sqlite3 prebuild isn't available for this arch.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 build-essential \
 && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ─── 2) Build the standalone server bundle ─────────────────────────────────
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm build

# ─── 3) Final runtime image ────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# The SQLite file lives here; docker-compose mounts a volume onto /data so
# it survives container restarts.
ENV DB_PATH=/data/sws.db

RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs nextjs

# Next.js standalone output.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public
# Drizzle migration files — read at startup by src/instrumentation.ts.
COPY --from=builder --chown=nextjs:nodejs /app/drizzle         ./drizzle

# Make sure the mount point exists and is writable by the non-root user.
RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
