# Build from the repository root:
#   docker build -f backend/Dockerfile -t steam-tracker-api .
FROM node:22-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY prisma prisma
RUN npm ci -w backend
COPY backend backend
RUN npm run build -w backend

FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY prisma prisma
RUN npm ci -w backend --omit=dev && npm cache clean --force
COPY --from=build /app/backend/dist backend/dist
WORKDIR /app/backend
USER node
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
