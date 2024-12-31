## Satisfactory_App/frontend/Dockerfile
#FROM node:20 AS builder
#WORKDIR /app
#COPY package*.json ./
#RUN npm install
#COPY . .
#RUN npm run build
#ENV VITE_API_URL=https://satisfactory-app.dynamic-dns.net/api
#
#FROM nginx:latest
#COPY nginx.conf /etc/nginx/nginx.conf
#COPY --from=builder /app/dist /usr/share/nginx/html
#EXPOSE 80
#CMD ["nginx", "-g", "daemon off;"]
#
# ------------------------------------------------#
# ------------------Development-------------------#
# ------------------vvvvvvvvvvv-------------------#


# Satisfactory_App/frontend/Dockerfile
# Use the official Node.js image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port Vite uses for development
EXPOSE 5173

# Start the Vite development server
CMD ["npm", "run", "dev", "--", "--host"]
#CMD ["npm", "run", "build"]
#CMD ["npx", "serve", "dist"]