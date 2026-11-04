ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Stage 1: install dependencies exactly as pinned in the lockfile.
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# Stage 2: build the standalone Next.js server.
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `next build` inlines NEXT_PUBLIC_* values into the server and browser bundles,
# so the API URL is fixed per image. Changing it requires a rebuild.
ARG NEXT_PUBLIC_API_URL
RUN test -n "$NEXT_PUBLIC_API_URL" || { echo "Build arg NEXT_PUBLIC_API_URL is required." >&2; exit 1; }
RUN npm run build

# Stage 3: minimal runtime with only the traced server files and static assets.
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

# The standalone trace already includes design-system/assets/lumix-logo-icon-white.png,
# which app/icon.tsx reads from process.cwd().
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
