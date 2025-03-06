# Use official Node.js image as base image
FROM node:16-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of your app's files
COPY . .

# Expose the port the app will run on (8080 in this case)
EXPOSE 8080

# Run the application
CMD ["node", "index.js"]
