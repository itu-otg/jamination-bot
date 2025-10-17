# Lightweight Node image
FROM node:20-alpine

# Enable Yarn 4
RUN corepack enable

WORKDIR /app

# Copy everything at once (no caching tricks)
COPY . .

# Install dependencies
RUN yarn install

# Build TypeScript
RUN yarn build

# Run Prisma migrations then start bot
CMD sh -c "yarn prisma migrate deploy && yarn start"

