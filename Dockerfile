# Builder stage
FROM node:lts AS builder

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

# Compiles native binaries inside node_modules
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force


# Runner stage - the final image
FROM node:lts-slim AS runner

ENV NODE_ENV=production

LABEL   org.opencontainers.image.source=https://github.com/EnhancedMind/WelcomerBot \
        org.opencontainers.image.description="Discord bot that plays sounds or music when somebody joins or leaves a voice channel." \
        org.opencontainers.image.licenses="GPL-3.0-or-later" \
        org.opencontainers.image.documentation="https://github.com/EnhancedMind/WelcomerBot#readme"

# Install ffmpeg and ffprobe
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg dumb-init && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN chown node:node /app

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

# Get build args from github action and pass them to ENV
ARG COMMIT_SHA="unknown"
ARG BUILD_NUMBER="0"
ARG BUILD_TIME="0"

ENV COMMIT_SHA=${COMMIT_SHA}
ENV BUILD_NUMBER=${BUILD_NUMBER}
ENV BUILD_TIME=${BUILD_TIME}


USER node

ENTRYPOINT ["dumb-init", "--"]

CMD [ "node", "src/main.js" ]
