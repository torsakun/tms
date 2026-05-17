FROM node:20-bookworm-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install Playwright OS dependencies
RUN npx -y playwright@1.59.1 install --with-deps chromium chromium-headless-shell

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Asia/Bangkok

# Install Playwright dependencies and unzip in runner
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN apt-get update && apt-get install -y unzip && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /ms-playwright
RUN npm install -g @playwright/test@1.59.1 playwright@1.59.1
RUN playwright install --with-deps chromium chromium-headless-shell

RUN addgroup --system --gid 1001 nodejs
# Create user with a real home directory to fix npm EACCES /nonexistent
RUN adduser --system --uid 1001 --home /home/nextjs nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache and reports
RUN mkdir -p .next
RUN mkdir -p /app/public/reports
RUN chown -R nextjs:nodejs .next /ms-playwright /app/public/reports

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Also copy Prisma schema to make sure migration works if needed inside the container
COPY --from=builder /app/prisma ./prisma

# Make sure nextjs user can run playwright browsers by granting permissions
RUN chmod -R 777 /ms-playwright || true

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
