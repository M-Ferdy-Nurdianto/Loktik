FROM node:18-slim

# Install Chromium and dependencies for puppeteer / whatsapp-web.js
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    ca-certificates \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PORT=5000

WORKDIR /app

# Copy root package configuration
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy server code
COPY server/ ./server/

EXPOSE 5000

CMD ["node", "server/wa-bot.cjs"]
