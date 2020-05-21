# Docker Image which is used as foundation to create

# builder image for the k8s_library js
FROM node:alpine as builder_k8s
WORKDIR /k8s_library
ADD ./k8s_library ./
RUN npm install --silent --unsafe-perm

# a custom Docker Image with this Dockerfile
FROM node:alpine as build-deps
# A directory within the virtualized Docker environment
# Becomes more relevant when using Docker Compose later
WORKDIR /app
# Copies package.json and package-lock.json to Docker environment
COPY package*.json ./
COPY --from=builder_k8s /k8s_library ./k8s_library
# Installs all node packages
RUN npm install --silent --unsafe-perm
# Copies everything over to Docker environment
COPY . ./
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-deps /app/dist /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
