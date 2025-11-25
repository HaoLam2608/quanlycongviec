# Use Node.js 20 Alpine for smaller image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set puppeteer to use installed chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start the application
CMD ["node", "index.js"]
