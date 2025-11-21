FROM node:18-alpine

# Use /app as working directory to match common PaaS expectations (Railway)
WORKDIR /app

# Install app dependencies (production)
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY . .

# Ensure uploads directory exists
RUN mkdir -p /app/uploads

ENV NODE_ENV=production

# Port (Railway will overwrite with its own $PORT)
EXPOSE 3000

CMD ["node", "src/index.js"]