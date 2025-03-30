#!/bin/bash

AWS_HOST=${2:-"aws-api.example.com"}
AWS_PORT=${3:-80}
GCP_HOST=${4:-"gcp-api.example.com"}
GCP_PORT=${5:-80}
AZURE_HOST=${6:-"azure-api.example.com"}
AZURE_PORT=${7:-80}

case "$1" in
  build)
    echo "=== Nginx 클라우드 라우터 이미지 빌드 ==="
    docker build -t cloud-nginx-router .
    echo "빌드 완료"
    ;;

  run)
    echo "=== Nginx 클라우드 라우터 컨테이너 실행 ==="
    echo "AWS 서비스: $AWS_HOST:$AWS_PORT"
    echo "GCP 서비스: $GCP_HOST:$GCP_PORT"
    echo "Azure 서비스: $AZURE_HOST:$AZURE_PORT"

    if [ "$(docker ps -q -f name=cloud-router)" ]; then
        echo "이미 실행 중인 컨테이너를 중지합니다."
        docker stop cloud-router > /dev/null
    fi
    if [ "$(docker ps -aq -f name=cloud-router)" ]; then
        echo "기존 컨테이너를 제거합니다."
        docker rm cloud-router > /dev/null
    fi

    docker run -d --name cloud-router \
      -p 80:80 \
      -e AWS_SERVICE_HOST=$AWS_HOST \
      -e AWS_SERVICE_PORT=$AWS_PORT \
      -e GCP_SERVICE_HOST=$GCP_HOST \
      -e GCP_SERVICE_PORT=$GCP_PORT \
      -e AZURE_SERVICE_HOST=$AZURE_HOST \
      -e AZURE_SERVICE_PORT=$AZURE_PORT \
      -e DEFAULT_SERVICE_HOST=$DEFAULT_HOST \
      -e DEFAULT_SERVICE_PORT=$DEFAULT_PORT \
      cloud-nginx-router

    echo ""
    echo "=== 실행 완료 ==="
    echo "로그 확인: $0 logs"
    echo "컨테이너 중지: $0 stop"
    ;;

  stop)
    echo "=== Nginx 클라우드 라우터 컨테이너 중지 ==="
    docker stop cloud-router
    ;;

  logs)
    echo "=== Nginx 클라우드 라우터 로그 보기 ==="
    docker logs cloud-router
    ;;

  run-direct)
    cat > /etc/nginx/nginx.conf <<EOF
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for" '
                    '"\$query_string" "\$cloud_provider"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    keepalive_timeout 65;

    upstream aws_backend {
        server ${AWS_SERVICE_HOST}:${AWS_SERVICE_PORT};
    }

    upstream gcp_backend {
        server ${GCP_SERVICE_HOST}:${GCP_SERVICE_PORT};
    }

    upstream azure_backend {
        server ${AZURE_SERVICE_HOST}:${AZURE_SERVICE_PORT};
    }

    server {
        listen 80;
        server_name localhost;

        set \$cloud_provider "";

        if (\$args ~ "cloud=([^&]+)") {
            set \$cloud_provider \$1;
        }

        location / {
            if (\$cloud_provider = "aws") {
                proxy_pass http://aws_backend;
            }
            
            if (\$cloud_provider = "gcp") {
                proxy_pass http://gcp_backend;
            }
            
            if (\$cloud_provider = "azure") {
                proxy_pass http://azure_backend;
            }

            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header X-Cloud-Provider \$cloud_provider;
        }

        location /health {
            access_log off;
            return 200 'OK';
        }

        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
EOF
    exec nginx -g "daemon off;"
    ;;

  *)
    echo "사용법: $0 {build|run|stop|logs}"
    echo ""
    echo "예시:"
    echo "  $0 build                                                 # 이미지 빌드"
    echo "  $0 stop                                                  # 실행 중인 컨테이너 중지"
    echo "  $0 logs                                                  # 컨테이너 로그 확인"
    echo "  $0 run                                                   # 기본 설정으로 실행"
    echo "  $0 run api.aws.com 443 api.gcp.com 443 api.azure.com 443 # 커스텀 설정으로 실행"
    exit 1
    ;;
esac 