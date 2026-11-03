# syntax=docker/dockerfile:1
# Multi-stage build for the AI Video Automation platform.
#   build  — install deps, generate Prisma client, produce the Next.js
#            standalone server bundle.
#   runtime — slim image with ffmpeg/ffprobe (video production), curl
#             (healthcheck), Prisma (auto-migrate on boot), and the
#             standalone server run by Bun.

FROM oven/bun:1.3 AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
# Prisma client must exist before next build traces imports.
RUN bunx prisma generate
RUN bun run build

FROM oven/bun:1.3 AS runtime
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

# Standalone server (already includes .next/static + public from the build script).
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
# Prisma client + CLI (for the boot-time db push in the entrypoint).
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY deploy/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Default SQLite DSN for the /app/db volume; overridable by the platform
# (e.g. to point at a managed DB). Without this the server has no DATABASE_URL
# (the repo .env is gitignored), Prisma cannot initialise, /api/health returns
# 503, and the Docker healthcheck fails the deploy.
ENV DATABASE_URL=file:/app/db/custom.db
EXPOSE 3000

# Persisted host volumes: SQLite DB, generated media, backups.
VOLUME ["/app/db", "/app/public/gen", "/app/backups"]

HEALTHCHECK --interval=60s --timeout=5s --retries=3 --start-period=30s \
  CMD curl -fs http://localhost:3000/api/health || exit 1

CMD ["./entrypoint.sh"]
