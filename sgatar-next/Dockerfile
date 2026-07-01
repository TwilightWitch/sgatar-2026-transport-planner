# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM gdssingapore/airbase:node-22-builder AS deps

WORKDIR /app

# Copy package files first for layer caching
COPY --chown=app:app package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# ── Stage 2: Build the Next.js app ───────────────────────────────────────────
FROM gdssingapore/airbase:node-22-builder AS builder

WORKDIR /app

# Bring in node_modules from deps stage
COPY --chown=app:app --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY --chown=app:app . .

# Build — output: standalone produces a self-contained server bundle
RUN npm run build

# ── Stage 3: Production runtime ──────────────────────────────────────────────
FROM gdssingapore/airbase:node-22

# Airbase requirement: read PORT from environment
ENV PORT=8080
ENV NODE_ENV=production
# Hostname must be 0.0.0.0 for container networking
ENV HOSTNAME=0.0.0.0

WORKDIR /app

# Copy the standalone server bundle (contains everything needed to run)
COPY --chown=app:app --from=builder /app/.next/standalone ./
# Copy the static assets (CSS, JS chunks, images)
COPY --chown=app:app --from=builder /app/.next/static ./.next/static
# Copy the public directory (favicons, og images, etc.)
COPY --chown=app:app --from=builder /app/public ./public

# Switch to the non-root user required by Airbase
USER app

EXPOSE 8080

# Health check — calls the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT||8080) + '/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Next.js standalone server
CMD ["node", "server.js"]
