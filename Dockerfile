# Multi-stage build dla Astro aplikacji
FROM node:20-alpine AS builder

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie plików package
COPY package*.json ./

# Instalacja dependencies (devDependencies wymagane do `astro build`)
RUN npm ci

# Kopiowanie kodu źródłowego
COPY . .

# Build aplikacji
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Instalacja dumb-init dla proper signal handling
RUN apk add --no-cache dumb-init

# Tworzenie użytkownika non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 astro

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie zbudowanej aplikacji
COPY --from=builder --chown=astro:nodejs /app/dist ./dist
COPY --from=builder --chown=astro:nodejs /app/package*.json ./

# Instalacja tylko production dependencies
RUN npm ci --only=production && npm cache clean --force

# Przełączenie na użytkownika non-root
USER astro

# Expose port
EXPOSE 3001

# Ustawienie zmiennych środowiskowych
ENV NODE_ENV=production
ENV PORT=3001

# Uruchomienie aplikacji z dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server/entry.mjs"]

