FROM --platform=linux/amd64 node:18-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install the Phala dstack SDK
RUN npm install @phala/dstack-sdk

# Copy package.json and package-lock.json to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Make scripts executable
RUN chmod +x generate_ra.js
RUN chmod +x attestation.py

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["node", "server.js"] 