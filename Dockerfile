FROM node as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

COPY prisma ./prisma/

RUN npm ci --production

RUN npx prisma generate

COPY --from=builder /usr/src/app/out ./out

EXPOSE 3000
CMD [ "node", "out/index.js" ]