FROM node as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN --mount=type=secret,id=npmrc \
  mv /run/secrets/npmrc $HOME/.npmrc 
  
RUN npm ci

RUN rm $HOME/.npmrc

COPY . .

RUN npm run build

FROM node:slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN --mount=type=secret,id=npmrc \
  mv /run/secrets/npmrc $HOME/.npmrc 
  
RUN npm ci --production

RUN rm $HOME/.npmrc

COPY --from=builder /usr/src/app/out ./out

EXPOSE 3000
CMD [ "node", "out/index.js" ]