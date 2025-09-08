# ---- Build Stage ----
# FROM node:22.6.0-alpine AS build
# WORKDIR /app

# # Install deps using lockfile
# COPY package*.json ./
# RUN npm ci --no-audit --no-fund

# # Copy the rest (commands/, events/, etc.)
# COPY . .

# ---- Production Stage ----
# Use an official Node.js runtime as a parent image.
# 'node:22-alpine' is small, secure, and has a recent version of Node.js.
FROM node:22-alpine

# Set the working directory inside the container. All subsequent commands will run from here.
WORKDIR /app

# Copy the package.json and package-lock.json files first.
# This leverages Docker's layer caching. If these files haven't changed, Docker
# can skip reinstalling dependencies, making future builds much faster.
COPY package*.json ./

# Install only the production dependencies listed in package.json.
# This keeps the final image size smaller and more secure by excluding devDependencies.
RUN npm ci --only=production

# Copy the rest of your application's source code into the container.
# This includes your index.js and any other folders/files.
COPY . .

# Create non-root user after files are in place (no need for chown during COPY)
RUN addgroup -S bot && adduser -S bot -G bot
USER bot

EXPOSE 8079
ENV NODE_ENV=production PORT=8079
CMD ["npm", "start"]