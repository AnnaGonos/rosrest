FROM node:18-alpine

WORKDIR /app

COPY apps/api/package*.json ./
COPY .env .env

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3002

CMD ["npm", "run", "start:prod"]
