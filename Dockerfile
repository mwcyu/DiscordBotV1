# Use the official Node.js 22 runtime as the base image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8079

# Define environment variables with default values
ENV NODE_ENV=production
ENV PORT=8079

# Start the application
CMD ["npm", "start"]
