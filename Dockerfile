# ---- Build Stage ----
# Installs all dependencies, including devDependencies needed for building
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# If you have a build step (e.g., for TypeScript), uncomment the next line
# RUN npm run build

# ---- Production Stage ----
# This stage will only contain the final, runnable application
FROM node:22-alpine
WORKDIR /app

# Create a non-root user for security
RUN addgroup -S bot && adduser -S bot -G bot
USER bot

# Copy only the necessary files from the 'build' stage
COPY --from=build --chown=bot:bot /app/package*.json ./
COPY --from=build --chown=bot:bot /app/node_modules ./node_modules
COPY --from=build --chown=bot:bot /app/src ./src 
# Or copy the 'dist' folder if you have a build step

# Expose the port and set environment variables
EXPOSE 8079
ENV NODE_ENV=production
ENV PORT=8079

# Start the application
CMD ["npm", "start"]