# --- Build stage ---
FROM oven/bun:1-alpine AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build
RUN ls -la /app/dist/

# --- Production stage ---
FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/openapi.json ./openapi.json

EXPOSE 3000
CMD ["bun", "run", "dist/server.js"]

