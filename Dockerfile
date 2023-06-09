FROM node:lts-buster

RUN apt-get update && \
    apt-get install -y ffmpeg v4l-utils && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
