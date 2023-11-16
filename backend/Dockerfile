FROM node:18

WORKDIR /usr/src/app

COPY --chown=node:node ./package.json ./package.json

RUN npm install

COPY --chown=node:node . .

#RUN npm run build

CMD npm run prisma:start && (npm run prisma:studio &) && npm run start:dev
