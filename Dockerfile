FROM nginx:alpine

# Copy all tools to the nginx html directory
COPY tools/ /usr/share/nginx/html/

# Copy the root index page
COPY index.html /usr/share/nginx/html/

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create tools directory if it doesn't exist
RUN mkdir -p /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]