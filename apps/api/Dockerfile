FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY tsconfig.json ./tsconfig.json
COPY src ./src
COPY ormconfig.* ./

RUN npm run build

RUN mkdir -p /app/dist/email/templates && cp -r /app/src/email/templates/. /app/dist/email/templates/ || true

EXPOSE 3002

CMD ["npm", "run", "start:prod"]
