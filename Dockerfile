FROM node as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN --mount=type=ssh --mount=type=secret,id=npmrc,dst=$HOME/.npmrc \
  npm ci

COPY . .

RUN npm run build

FROM node:slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN --mount=type=ssh --mount=type=secret,id=npmrc,dst=$HOME/.npmrc \
  npm ci --production

COPY --from=builder /usr/src/app/out ./out

EXPOSE 3000
CMD [ "node", "out/index.js" ]