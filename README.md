# 클라우드 서비스 라우팅 프로젝트

이 프로젝트는 다양한 클라우드 서비스(AWS, GCP, Azure)의 리소스를 쿼리하고 관리하는 NestJS 애플리케이션과, 쿼리 파라미터 기반으로 요청을 라우팅하는 Nginx 리버스 프록시로 구성되어 있습니다.

## 구성 요소

1. **NestJS 서버**: AWS, GCP, Azure 서비스의 리소스를 조회하고 관리
2. **Nginx 리버스 프록시**: `cloud` 쿼리 파라미터 값에 따라 요청을 적절한 서비스로 라우팅

## NestJS 서버 구동 방법

### 1. AWS EC2 및 Azure 가상머신 생성

NestJS 서버를 구동할 EC2 인스턴스, Azure 가상머신을 생성합니다.

### 2. IAM 권한 설정

로드 밸런서, 부하 분산 장치와 AssumeRole, Managed Identity를 조회하기 위한 최소 권한을 서비스에 제공합니다:

```json
# AWS
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Statement1",
            "Effect": "Allow",
            "Action": [
                "elasticloadbalancing:DescribeLoadBalancers",
                "elasticloadbalancing:DescribeTargetGroups",
                "elasticloadbalancing:DescribeListeners",
                "elasticloadbalancing:DescribeTargetHealth",
                "iam:ListUserPolicies",
                "iam:GetUserPolicy",
                "iam:ListAttachedRolePolicies",
                "iam:GetPolicy",
                "iam:GetPolicyVersion"
            ],
            "Resource": "*"
        }
    ]
}

# AZURE
{
    "permissions": [
        {
            "actions": [
                "Microsoft.Network/loadBalancers/read",
                "Microsoft.Network/networkInterfaces/read",
                "Microsoft.Authorization/roleAssignments/read",
                "Microsoft.Authorization/roleDefinitions/read"
            ],
            "notActions": [],
            "dataActions": [],
            "notDataActions": []
        }
    ]
}
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음과 같이 설정합니다:

```
# AWS 설정
AWS_REGION=

# Azure 설정
AZURE_SUBSCRIPTION_ID=
```

### 4. 도커를 통한 서버 실행

```bash
# 이미지 빌드
docker build -t cloud-service .

# 컨테이너 실행
docker run -p 80:3000 --env-file .env cloud-service -d
```

### 5. 인바운드 포트 설정

보안 그룹에서 인바운드 포트 80을 열어둡니다.

## Nginx 리버스 프록시 설정

Nginx는 로컬 서버이든, 클라우드 서비스 내부 인스턴스이든 상관없이 설정할 수 있습니다.

### 1. 통합 스크립트로 Nginx 실행

프로젝트의 루트 디렉토리에서 다음 명령어를 실행합니다:

```bash
# Nginx 디렉토리로 이동
cd infra

# 이미지 빌드
./cloud-router.sh build

# 컨테이너 실행 (각 클라우드 서비스의 도메인 지정)
./cloud-router.sh run aws.your-domain.com 80 gcp.your-domain.com 80 azure.your-domain.com 80
```

### 2. 추가 명령어

도움말 및 추가 명령어는 다음과 같이 확인할 수 있습니다:

```bash
./cloud-router.sh help
```

주요 명령어:
- `build`: Nginx 이미지 빌드
- `run`: 컨테이너 실행
- `logs`: 컨테이너 로그 확인
- `stop`: 컨테이너 중지
