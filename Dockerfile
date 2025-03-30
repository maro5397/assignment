FROM node:20-alpine AS build

WORKDIR /workspace

COPY . .

RUN npm ci && \
    npm run build

FROM node:20-alpine
WORKDIR /server

# 타임존 설정
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
    echo "Asia/Seoul" > /etc/timezone && \
    apk del tzdata

# 빌드 스테이지에서 생성된 파일들 복사
COPY --from=build /workspace/dist ./dist
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/package*.json ./

# 환경 변수를 사용하여 애플리케이션 실행
ENTRYPOINT ["node", "dist/main"]