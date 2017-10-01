FROM node:8-alpine

RUN apk add --no-cache --virtual .gyp python make g++

ENV NODE_ENV=production SERVER_ASSETS=public/

COPY backend/build/src src
COPY backend/package.json .
COPY frontend/dist public

RUN npm install --production && apk del .gyp

ENTRYPOINT ["node"]
CMD ["src/index.js"]

