FROM node:20-alpine

RUN npm install -g @arabold/docs-mcp-server

ENV PORT=8080
ENV DOCS_URL=https://docs.genlayer.com
ENV SDK_URL=https://sdk.genlayer.com/main/

EXPOSE 8080

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
