FROM node:24-alpine
WORKDIR /app
COPY . .
RUN mkdir -p /app/datos && chown -R node:node /app/datos
USER node
EXPOSE 3000
CMD ["node", "server.js"]

