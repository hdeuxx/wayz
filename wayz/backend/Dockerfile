FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y python3 make g++ && \
    npm ci --omit=dev && \
    apt-get purge -y python3 make g++ && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
COPY src ./src
ENV DATA_DIR=/data
VOLUME /data
EXPOSE 3000
CMD ["node", "src/index.js"]
