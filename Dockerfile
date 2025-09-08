# ---- Build Stage ----
# FROM node:22.6.0-alpine AS build
# WORKDIR /app

# # Install deps using lockfile
# COPY package*.json ./
# RUN npm ci --no-audit --no-fund

# # Copy the rest (commands/, events/, etc.)
# COPY . .

# ---- Production Stage ----
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN addgroup -S bot && adduser -S bot -G bot
USER bot
EXPOSE 8079
ENV NODE_ENV=production PORT=8079
CMD ["npm", "start"]