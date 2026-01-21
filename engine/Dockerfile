FROM node:18-alpine

RUN apk add --no-cache bash tini

WORKDIR /usr/src/engine

COPY package*.json ./
RUN npm ci

COPY . .

# ensure binary is executable
RUN chmod +x ./bin/* || true

EXPOSE 3001

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]

