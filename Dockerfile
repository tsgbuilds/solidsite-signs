FROM node:24-alpine
RUN apk add --no-cache su-exec
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATA_DIR=/data
COPY --chown=node:node package.json server.mjs ./
COPY --chown=node:node lib ./lib
COPY --chown=node:node data/catalog.json ./data/catalog.json
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node public ./public
RUN mkdir /data && chown node:node /data
EXPOSE 3000
# Persistent storage is attached through Railway, not a Docker VOLUME directive.
# Initialize permissions on Railway's root-owned mount, then run Node unprivileged.
ENTRYPOINT ["sh", "scripts/start-container.sh"]
CMD ["node", "server.mjs"]
