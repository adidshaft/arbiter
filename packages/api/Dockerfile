FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS dev
ENV NODE_ENV=development
COPY package.json ./
COPY packages/api/package.json packages/api/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/dashboard/package.json packages/dashboard/package.json
RUN npm install
CMD ["npm", "run", "dev", "--workspace=packages/api"]

FROM base AS build
COPY package.json ./
COPY packages/api/package.json packages/api/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/dashboard/package.json packages/dashboard/package.json
RUN npm install
COPY . .
RUN npm run build --workspace=packages/core && npm run build --workspace=packages/api

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
RUN corepack enable
COPY package.json ./
COPY packages/api/package.json packages/api/package.json
COPY packages/core/package.json packages/core/package.json
RUN npm install --omit=dev
COPY --from=build /app/packages/core/dist packages/core/dist
COPY --from=build /app/packages/api/dist packages/api/dist
EXPOSE 3001
CMD ["node", "packages/api/dist/index.js"]
