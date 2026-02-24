FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Install newer Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

WORKDIR /app

# Copy everything first including prisma folder
COPY . .

# Now install — prisma schema exists at this point
RUN npm install --ignore-scripts
RUN npx prisma generate
RUN npx playwright install chromium --with-deps

EXPOSE 3000

CMD npx prisma migrate deploy && node src/index.js