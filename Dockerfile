# ---- Build Stage ----
FROM node:22.6.0-alpine AS build   
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# RUN npm run build  # (uncomment if you actually have a build step)

# ---- Production Stage ----
FROM node:22.6.0-alpine
WORKDIR /app

# security: non-root
RUN addgroup -S bot && adduser -S bot -G bot
USER bot

COPY --from=build --chown=bot:bot /app/package*.json ./
COPY --from=build --chown=bot:bot /app/node_modules ./node_modules
COPY --from=build --chown=bot:bot /app/index.js ./
EXPOSE 8079
ENV NODE_ENV=production PORT=8079
CMD ["npm", "start"]