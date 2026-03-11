FROM node:20-alpine

RUN apk add --no-cache python3 make g++ && \
    npm install -g @arabold/docs-mcp-server && \
    apk del python3 make g++

ENV PORT=8080
ENV DOCS_URL=https://docs.genlayer.com
ENV SDK_URL=https://sdk.genlayer.com/main/

EXPOSE 8080

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
