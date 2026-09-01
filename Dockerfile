# Multi-stage build for the blog (Next.js 16 standalone + Prisma + SQLite).
#
# Runtime layout:
#   /app          the standalone server
#   /data         SQLite database   (Docker volume — persists across deploys)
#   /app/public/uploads  uploaded images (Docker volume — persists)

# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
# Skip the postinstall `prisma generate` here; the builder stage runs it once
# the schema has been copied in.
RUN npm ci --ignore-scripts

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined at build time, so the public URL must be
# known here (passed from docker-compose as a build arg).
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SITE_NAME
ARG NEXT_PUBLIC_ADSENSE_CLIENT=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME \
    NEXT_PUBLIC_ADSENSE_CLIENT=$NEXT_PUBLIC_ADSENSE_CLIENT

# A throwaway build-time database. `next build` pre-renders some pages, and
# generateStaticParams queries the DB, so the tables must exist — an empty
# schema is enough (queries just return nothing). The real database is a
# runtime volume; nothing from this file ships in the final image.
ENV DATABASE_URL="file:/tmp/build.db"

RUN npx prisma generate \
    && npx prisma migrate deploy \
    && npm run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Next.js standalone output.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma runtime: schema + migrations + generated client + CLI (for
# `migrate deploy` on startup).
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

COPY scripts/bootstrap-admin.mjs ./scripts/bootstrap-admin.mjs
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh \
    && mkdir -p /data /app/public/uploads

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
