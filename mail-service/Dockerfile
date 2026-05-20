FROM oven/bun:1.3-alpine
WORKDIR /app
COPY package.json ./
RUN bun install
COPY server.js ./
ENV SMTP_PORT=25
EXPOSE 25
CMD ["bun", "server.js"]
