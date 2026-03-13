FROM node:24-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    npm install -g @arabold/docs-mcp-server@2.0.4 && \
    apt-get purge -y python3 make g++ && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

ENV PORT=8080
ENV DOCS_URL=https://docs.genlayer.com
ENV SDK_URL=https://sdk.genlayer.com/main/

EXPOSE 8080

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
