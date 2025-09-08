# ---- Production Stage ----
FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm cache clean --force && \
    npm ci --omit=dev --verbose --no-audit --no-fund
COPY . .
RUN addgroup --system --group bot && adduser --system --ingroup bot bot
USER bot
EXPOSE 8079
ENV NODE_ENV=production PORT=8079
CMD ["npm", "start"]