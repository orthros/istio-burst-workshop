FROM alpine as yarn

RUN echo -e 'http://dl-cdn.alpinelinux.org/alpine/edge/main\nhttp://dl-cdn.alpinelinux.org/alpine/edge/community\nhttp://dl-cdn.alpinelinux.org/alpine/edge/testing' > /etc/apk/repositories
RUN apk add --no-cache yarn

WORKDIR /application

COPY package.json /application
# COPY yarn.lock /application
RUN yarn

FROM node:alpine

WORKDIR /application
COPY ./ /application
COPY --from=yarn  application/node_modules /application/node_modules

CMD ["npm", "start"]