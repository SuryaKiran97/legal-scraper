FROM ghcr.io/puppeteer/puppeteer:21.0.0

USER root

WORKDIR /home/pptruser/app

COPY --chown=pptruser:pptruser package*.json ./
COPY --chown=pptruser:pptruser prisma ./prisma/

USER pptruser

RUN npm install --ignore-scripts
RUN npx prisma generate

COPY --chown=pptruser:pptruser . .

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
