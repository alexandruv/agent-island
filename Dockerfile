FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
COPY server ./server
RUN npm run build
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/server/boundary.ts /app/server/feed.ts ./server/
COPY --from=build /app/vite.config.ts ./vite.config.ts
COPY tests/fixtures/demo-feed.json /app/demo-feed.json
ENV AGENT_ISLAND_FEED_CONFIG=/app/demo-feed.json
USER node
EXPOSE 4173
CMD ["node", "node_modules/vite/bin/vite.js", "preview", "--host", "0.0.0.0", "--port", "4173", "--strictPort", "--configLoader", "runner"]
