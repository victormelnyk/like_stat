FROM node

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY src /usr/src/app/src
COPY package.json /usr/src/app/
COPY node_modules /usr/src/app/node_modules

EXPOSE 3010

CMD [ "npm", "start" ]
