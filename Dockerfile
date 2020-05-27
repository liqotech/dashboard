# Docker Image which is used as foundation to create
# builder image for the k8s_library js
FROM node:alpine as builder_k8s
# Download git to fetch the kubernetes repo
RUN apk add --no-cache --update git openssh
RUN git clone https://github.com/LiqoTech/kubernetes-client-javascript.git
WORKDIR /kubernetes-client-javascript
RUN npm install --silent --unsafe-perm
RUN npm run build

# a custom Docker Image with this Dockerfile
FROM node:alpine as build-deps
RUN apk add --no-cache --update git openssh
# A directory within the virtualized Docker environment
# Becomes more relevant when using Docker Compose later
WORKDIR /app
# Copies package.json and package-lock.json to Docker environment
COPY package*.json ./
# Installs all node packages
RUN npm install --silent --unsafe-perm
COPY --from=builder_k8s /kubernetes-client-javascript/dist ./node_modules/@kubernetes/client-node/dist
# Copies everything over to Docker environment
COPY . ./
RUN npm run build

FROM nginx:alpine
COPY --chown=101:101 --from=build-deps /app/dist /usr/share/nginx/html
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=101:101 docker-entrypoint.sh /
COPY --chown=101:101 generate_config_js.sh /

RUN chmod +x docker-entrypoint.sh generate_config_js.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
