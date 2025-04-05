FROM --platform=linux/amd64 node:18-slim

WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["node", "server.js"] 