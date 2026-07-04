# Build React App
FROM node:18-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Serve built assets using Nginx
FROM nginx:1.25-alpine

COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Custom nginx server config for SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
