FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV VITE_API_URL=/api
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf.template /etc/nginx/templates/portal.conf.template
COPY nginx/entrypoint.sh /opt/portal-entrypoint.sh
COPY --from=build /build/dist /usr/share/nginx/html
USER root
RUN chmod 755 /opt/portal-entrypoint.sh && chmod a+r /etc/nginx/nginx.conf && chmod -R a+rX /usr/share/nginx/html /etc/nginx/templates
USER 101
EXPOSE 8080
ENTRYPOINT ["/bin/sh", "/opt/portal-entrypoint.sh"]
