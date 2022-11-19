FROM node as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN --mount=type=secret,id=npmrc \
  cat /run/secrets/npmrc >> .npmrc 
  
RUN npm ci

RUN rm .npmrc

COPY . .

RUN npm run build

FROM node:slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN --mount=type=secret,id=npmrc \
  cat /run/secrets/npmrc >> .npmrc 
  
RUN cat .npmrc

RUN npm ci --production

RUN rm .npmrc

COPY --from=builder /usr/src/app/out ./out

EXPOSE 3000
CMD [ "node", "out/index.js" ]