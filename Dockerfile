# use the official Bun image
FROM oven/bun:1
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install ALL dependencies (including dev dependencies)
RUN bun install --frozen-lockfile --non-interactive

# Copy all project files
COPY . .

# Set production environment and build
ENV NODE_ENV=production
RUN bun run build

# Move Vite from devDependencies to dependencies for the preview server
# This ensures Vite is available at runtime in production environments
RUN bun add vite @vitejs/plugin-react

# Expose the port that the app will run on
EXPOSE 7860

# Use the preview command directly with Bun to avoid any script-related issues
CMD ["bun", "run", "--bun", "vite", "preview", "--host", "--port", "7860"]