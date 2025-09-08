# ---- Production Stage ----
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN addgroup -S bot && adduser -S bot -G bot
USER bot
EXPOSE 8079
ENV NODE_ENV=production PORT=8079
CMD ["npm", "start"]