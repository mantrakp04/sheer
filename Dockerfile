# Stage 1: Build the React/Vite application with Bun
FROM oven/bun:1 AS builder
WORKDIR /app

# Install dependencies into temp directory
# This will cache them and speed up future builds
COPY package.json bun.lock ./
RUN bun install

# Copy all project files and build the application
COPY . .
ENV NODE_ENV=production
RUN bun run build

CMD ["bun", "run", "preview"]