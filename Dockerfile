# Stage 1: Build the React/Vite application with Bun
FROM oven/bun:1 AS builder
WORKDIR /app

# Install dependencies into temp directory
# This will cache them and speed up future builds
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy all project files and build the application
COPY . .
ENV NODE_ENV=production
RUN bun run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
# Use custom Nginx configuration
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 7860
CMD ["nginx", "-g", "daemon off;"]
# docker build -t react-app . && docker run -p 7860:7860 react-app