FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

RUN apk add --no-cache bash curl

ENV AWS_SERVICE_HOST=aws-api.example.com \
    AWS_SERVICE_PORT=80 \
    GCP_SERVICE_HOST=gcp-api.example.com \
    GCP_SERVICE_PORT=80 \
    AZURE_SERVICE_HOST=azure-api.example.com \
    AZURE_SERVICE_PORT=80 \
    DEFAULT_SERVICE_HOST=default-api.example.com \
    DEFAULT_SERVICE_PORT=80

COPY cloud-router.sh /cloud-router.sh
RUN chmod +x /cloud-router.sh

EXPOSE 80

CMD ["/cloud-router.sh", "run-direct"] 