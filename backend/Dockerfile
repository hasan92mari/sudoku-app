# Stage 1: install dependencies
FROM node:20-bookworm-slim AS build-stage
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN rm -rf node_modules

# Stage 2: production runtime
FROM node:20-bookworm-slim
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev --package-lock=false \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

COPY --from=build-stage /app .

USER node

EXPOSE 5001

CMD ["node", "index.js"]