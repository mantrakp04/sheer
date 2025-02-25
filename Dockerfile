FROM nginx:alpine

# Create directories and set permissions first
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp \
    && chmod 700 /var/cache/nginx/* \
    && chown -R nginx:nginx /var/cache/nginx

# Copy our custom nginx.conf to replace the default one
COPY nginx.conf /etc/nginx/nginx.conf
RUN chown -R nginx:nginx /etc/nginx

# Clean up default conf
RUN rm -f /etc/nginx/conf.d/default.conf

# Switch to non-root user
USER nginx

# Expose port 7860
EXPOSE 7860

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
