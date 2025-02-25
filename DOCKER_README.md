# Cloudflare Pages Proxy Docker Container

This Docker container sets up an Nginx server that proxies requests to your Cloudflare Pages site (https://sheer-8kp.pages.dev/) and makes it available on port 7860.

## Requirements

- Docker installed on your system
- Internet access to reach the Cloudflare Pages site

## Building the Docker Image

To build the Docker image, navigate to the directory containing the Dockerfile and run:

```bash
docker build -t cloudflare-proxy .
```

## Running the Docker Container

To start the container:

```bash
docker run -d -p 7860:7860 --name cloudflare-proxy-container cloudflare-proxy
```

After running this command, you can access your Cloudflare Pages site at:

```
http://localhost:7860
```

## Stopping the Container

To stop the running container:

```bash
docker stop cloudflare-proxy-container
```

## Removing the Container

To remove the container:

```bash
docker rm cloudflare-proxy-container
```

## Technical Details

- The container uses Nginx as a reverse proxy
- Traffic is forwarded to https://sheer-8kp.pages.dev/
- Appropriate headers are set to ensure proper proxying
- The container runs on port 7860 