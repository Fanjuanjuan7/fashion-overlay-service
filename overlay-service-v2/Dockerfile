FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    PORT=7001 \
    CHROMIUM_PATH=/usr/bin/chromium

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    chromium \
    fonts-noto \
    fonts-noto-core \
    fonts-noto-extra \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    fonts-thai-tlwg \
    fontconfig \
    libvips \
    && fc-cache -f -v \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY server.js ./

EXPOSE 7001
CMD ["node", "server.js"]
