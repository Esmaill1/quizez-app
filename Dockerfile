# Base stage for dependencies
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++

# Copy package files for the root and all workspaces
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all dependencies using workspaces
RUN npm install

# Build stage
FROM base AS builder
COPY . .
# Build both frontend and backend
RUN npm run build

# Final production stage
FROM node:18-alpine
WORKDIR /app

# Install build tools temporarily for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install only production dependencies for the backend using workspaces
RUN npm install --omit=dev -w backend

# Remove build tools after installation
RUN apk del python3 make g++

# Copy compiled files
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist

# Environment variables for Hugging Face
ENV NODE_ENV=production
ENV PORT=7860

# Expose the HF default port
EXPOSE 7860

# Start the application from the root to ensure paths resolve correctly
CMD ["node", "backend/dist/index.js"]
