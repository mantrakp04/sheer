FROM nginx:alpine

# Create a custom nginx configuration
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

# Expose port 7860
EXPOSE 7860

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
