FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY .env .env

RUN npm install

COPY ./src ./src
COPY ./ormconfig.* ./
COPY ./test ./test
COPY ./uploads ./uploads

RUN npm run build

EXPOSE 3002

CMD ["npm", "run", "start:prod"]
