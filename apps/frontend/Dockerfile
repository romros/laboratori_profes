# Monorepo: context = arrel del repo (veure docker-compose.yml)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/
RUN npm ci
COPY apps/frontend apps/frontend
RUN npm run build -w @profes/frontend

FROM nginx:1.27-alpine
RUN apk add --no-cache openssl
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80 443
ENTRYPOINT ["/docker-entrypoint.sh"]
