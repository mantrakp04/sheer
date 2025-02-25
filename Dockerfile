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
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18.x
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/* && \
    node -v && npm -v

# Create and set working directory
WORKDIR /app

# Install Bun with more robust permission handling
RUN curl -fsSL https://bun.sh/install | bash && \
    # Make sure bun is executable
    chmod 755 /root/.bun/bin/bun && \
    # Create symlink in a standard PATH location
    ln -sf /root/.bun/bin/bun /usr/local/bin/bun && \
    # Verify bun works
    bun --version

# Add Bun to PATH explicitly (backup method)
ENV PATH="/root/.bun/bin:/usr/local/bin:$PATH"

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
CMD bun run preview
