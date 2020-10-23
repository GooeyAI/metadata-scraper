FROM node:lts-alpine

COPY package-lock.json package.json ./
RUN npm i

COPY . .

EXPOSE 3000
RUN node src/index.js
