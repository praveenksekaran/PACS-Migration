FROM node:20-alpine

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src/ ./src/
COPY config/ ./config/

# Create directories the app expects
RUN mkdir -p logs data import

EXPOSE 5001

CMD ["node", "src/app.js"]
