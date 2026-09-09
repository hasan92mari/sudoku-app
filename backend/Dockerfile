# Stage 1: install dependencies
FROM node:20-alpine AS build-stage
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Stage 2: production runtime
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build-stage /app .

USER node

EXPOSE 5001

CMD ["node", "index.js"]