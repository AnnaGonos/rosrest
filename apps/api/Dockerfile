FROM node:18-alpine

WORKDIR /app

COPY apps/api/package*.json ./
COPY .env .env

RUN npm install

COPY apps/api/tsconfig.json ./tsconfig.json
COPY apps/api/src ./src
COPY apps/api/ormconfig.* ./
COPY apps/api/uploads ./uploads

RUN npm run build

RUN mkdir -p /app/dist/email/templates && cp -r /app/src/email/templates/* /app/dist/email/templates/

EXPOSE 3002

CMD ["npm", "run", "start:prod"]
