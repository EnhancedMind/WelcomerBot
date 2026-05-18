FROM node:lts

ENV NODE_ENV=production

LABEL   org.opencontainers.image.source=https://github.com/EnhancedMind/WelcomerBot \
        org.opencontainers.image.description="Discord bot that plays sounds or music when somebody joins or leaves a voice channel." \
        org.opencontainers.image.licenses="GPL-3.0-or-later" \
        org.opencontainers.image.documentation="https://github.com/EnhancedMind/WelcomerBot#readme"

# Install ffmpeg and ffprobe
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY --chown=node:node . .

USER node

CMD [ "node", "src/main.js" ]
