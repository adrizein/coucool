FROM node:8-alpine

COPY backend/build/src src
COPY backend/package.json .
COPY frontend/dist public

ENV NODE_ENV=production
ENV SERVER_ASSETS public/

RUN npm install --production

ENTRYPOINT ["node"]
CMD ["src/index.js"]

