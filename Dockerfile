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

RUN npm install --no-audit --no-fund

COPY --chown=node:node . .

# Get build args from github action and pass them to ENV
ARG COMMIT_SHA="unknown"
ARG BUILD_NUMBER="0"

ENV COMMIT_SHA=${COMMIT_SHA}
ENV BUILD_NUMBER=${BUILD_NUMBER}


USER node

CMD [ "node", "src/main.js" ]
