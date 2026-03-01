FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY .env .env

RUN npm install

COPY apps/api/src ./src
COPY apps/api/ormconfig.* ./
COPY apps/api/uploads ./uploads

RUN npm run build

EXPOSE 3002

CMD ["npm", "run", "start:prod"]
