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
CMD ["npm", "run", "dev", "--workspace=packages/dashboard", "--", "--host", "0.0.0.0"]

FROM base AS build
COPY package.json ./
COPY packages/api/package.json packages/api/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/dashboard/package.json packages/dashboard/package.json
RUN npm install
COPY . .
RUN npm run build --workspace=packages/core && npm run build --workspace=packages/dashboard

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json ./
COPY packages/api/package.json packages/api/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/dashboard/package.json packages/dashboard/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages/dashboard/dist packages/dashboard/dist
EXPOSE 4173
CMD ["./node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
