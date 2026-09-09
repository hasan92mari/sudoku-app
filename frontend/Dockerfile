# Stage 1: Build the React application
FROM node:20-bookworm-slim AS build-stage
WORKDIR /app

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run the app with Node.js and serve static files
FROM node:20-bookworm-slim
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev --package-lock=false \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/server.js ./server.js

RUN rm -f package.json package-lock.json

USER node

EXPOSE 80

CMD ["node", "server.js"]