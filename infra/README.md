# Nginx 클라우드 라우터

이 Nginx 설정은 HTTP 쿼리 파라미터 `cloud`의 값에 따라 요청을 다른 도메인으로 라우팅합니다.

## 주요 기능

- 쿼리 파라미터 기반 라우팅: `?cloud=aws|gcp|azure`
- 외부 도메인 서비스로 요청 전달
- 상세 로깅 및 헬스 체크 엔드포인트

## 라우팅 규칙

- `?cloud=aws` → AWS 서비스 도메인 (기본값: aws-api.example.com)
- `?cloud=gcp` → GCP 서비스 도메인 (기본값: gcp-api.example.com)
- `?cloud=azure` → Azure 서비스 도메인 (기본값: azure-api.example.com)

## 사용 방법

### 이미지 빌드

```bash
cd infra
./cloud-router.sh build
```

### 기본 도메인으로 실행

```bash
./cloud-router.sh run
```

### 커스텀 도메인으로 실행

```bash
./cloud-router.sh run aws.your-domain.com 80 gcp.your-domain.com 80 azure.your-domain.com 80
```

### 관리 명령어

```bash
./cloud-router.sh logs
./cloud-router.sh stop
```
