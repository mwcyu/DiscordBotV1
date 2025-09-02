# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci
COPY . .
# If TypeScript, ensure your build step writes to /app/dist
# RUN npm run build


# Use the official Node.js 22 runtime as the base image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Create a non-root user
RUN useradd -m bot && chown -R bot:bot /app
USER bot
COPY --from=build /app ./

# Expose the port the app runs on
EXPOSE 8079

# Define environment variables with default values
ENV NODE_ENV=production
ENV PORT=8079

# Start the application
CMD ["npm", "start"]
