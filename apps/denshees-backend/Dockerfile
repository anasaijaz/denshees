#Build stage
FROM node:lts-alpine

WORKDIR /app

COPY . .
RUN npm ci

EXPOSE 8100

CMD ["npm", "run", "start"]