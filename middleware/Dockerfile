FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies (production)
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY . .

# Ensure uploads directory exists
RUN mkdir -p /usr/src/app/uploads

ENV NODE_ENV=production

# Port (Railway will overwrite with its own $PORT)
EXPOSE 3000

CMD ["node", "src/index.js"]
