FROM ghcr.io/puppeteer/puppeteer:20.8.1

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
