# Use the official Ubuntu base image
FROM ubuntu:latest

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Install necessary packages
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create and set working directory
WORKDIR /app

# Install Bun (following the official method)
RUN curl -fsSL https://bun.sh/install | bash \
    && chmod +x /root/.bun/bin/bun \
    && ln -s /root/.bun/bin/bun /usr/local/bin/bun

# Add Bun to PATH
ENV PATH="/root/.bun/bin:$PATH"

# Copy package.json and package-lock.json
COPY package.json ./
COPY bun.lock ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Build the application
RUN bun run build

# Expose the port the app runs on
EXPOSE 7860

# Command to run the application
CMD ["bun", "run", "preview"]
