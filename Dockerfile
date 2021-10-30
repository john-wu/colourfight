FROM node:17
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 9090 9091
CMD [ "node", "server/server.js" ]