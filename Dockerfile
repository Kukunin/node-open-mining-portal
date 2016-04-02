FROM node:5.10
MAINTAINER Sergiy Kukunin <sergiy.kukunin@gmail.com>

RUN groupadd -r nomp && useradd -r -g nomp nomp && \
    mkdir /data && chown nomp.nomp /data && \
    mkdir /app && \
    ln -s /data/config.json /app/config.json && \
    ln -s /data/pool_configs /app/pool_configs

COPY . /app
WORKDIR /app

RUN chown -R nomp.nomp /app && \
    npm install

USER nomp
VOLUME /data
EXPOSE 3000

CMD ["/usr/local/bin/node", "init.js"]
