# ==========================================
# STAGE 1: Build static React TS Single Page App
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY shared/ ./shared/
COPY frontend/package*.json ./frontend/
RUN npm ci --prefix frontend

COPY frontend/ ./frontend/
RUN npm run build --prefix frontend

# ==========================================
# STAGE 2: Build backend TypeScript application
# ==========================================
FROM node:20-alpine AS backend-builder
WORKDIR /app

COPY shared/ ./shared/
COPY backend/package*.json ./backend/
RUN npm ci --prefix backend

COPY backend/tsconfig.json ./backend/
COPY backend/src ./backend/src
RUN npm run build --prefix backend

# ==========================================
# STAGE 3: Production Runner environment
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY backend/package*.json ./backend/
RUN npm ci --prefix backend --only=production

COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8080

CMD ["node", "backend/dist/backend/src/index.js"]
