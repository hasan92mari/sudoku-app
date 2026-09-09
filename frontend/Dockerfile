# Stage 1: Build the React application
FROM node:20-alpine AS build-stage
WORKDIR /app

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run the app with Node.js and serve static files
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/server.js ./server.js

EXPOSE 80

CMD ["node", "server.js"]