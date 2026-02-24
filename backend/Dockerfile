FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npx prisma generate

COPY . .

RUN npx playwright install chromium

EXPOSE 3000

CMD npx prisma migrate deploy && node src/index.js
