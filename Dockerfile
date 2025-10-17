# Use a lightweight Node image
FROM node:20-alpine

# Enable corepack so we can use Yarn 4
RUN corepack enable

WORKDIR /app

# Copy only package files first for efficient caching
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --immutable

# Copy the rest of the source
COPY . .

# Build TypeScript -> dist/
RUN yarn build

# Run Prisma migrations before starting
CMD sh -c "yarn prisma migrate deploy && yarn start"

