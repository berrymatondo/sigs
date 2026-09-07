# syntax=docker/dockerfile:1.7

# Debian "slim" (glibc) rather than Alpine: prisma/schema.prisma pins the
# `rhel-openssl-3.0.x` engine binary target, which needs glibc — it will not
# run on Alpine's musl libc. Slim keeps the image small without that risk.
FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1

# Without the openssl CLI, Prisma can't detect the libssl version at
# generate/runtime and silently defaults to the wrong engine variant.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# ---- deps: install dependencies once, cached independently of source code ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: generate the Prisma client and build the Next.js app ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma only needs a syntactically valid URL to generate the client at build
# time — no database connection is actually made. The real value is supplied
# to the container at "docker run" / compose, never baked into the image.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
RUN npx prisma generate \
  && rm -f lib/generated/prisma/query_engine-windows.dll.node*

RUN npm run build

# ---- runner: minimal production image ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public

# Next.js "standalone" output ships a pruned node_modules tree traced from
# actual imports — this, not the base image, is what keeps this build light.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Safety net: the Prisma engine binary is resolved by Prisma at runtime via a
# dynamic require(), which Next's static file-tracing can miss. Copying the
# generated client directly guarantees it's present.
COPY --from=builder --chown=nextjs:nodejs /app/lib/generated/prisma ./lib/generated/prisma

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
