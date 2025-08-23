# 토스 페이먼츠 구독 결제 API 가이드

## 개요
이 API는 토스페이먼츠를 이용한 구독 기반 결제 시스템을 제공합니다.

## API 엔드포인트

### 1. 플랜 목록 조회
```
GET /v1/subscription
```
사용 가능한 구독 플랜 목록을 조회합니다.

### 2. 빌링키 발급
```
POST /v1/subscription/billing-key/{factory_id}
```
카드 정보를 이용해 정기결제용 빌링키를 발급받습니다.

**Request Body:**
```json
{
  "card_number": "4330123456781234",
  "card_expiry_year": "25",
  "card_expiry_month": "12",
  "card_password": "12",
  "customer_identity_number": "950101"
}
```

### 3. 구독 결제
```
POST /v1/subscription/payment/{factory_id}
```
발급받은 빌링키를 사용해 구독 결제를 진행합니다.

**Request Body:**
```json
{
  "subscription_id": 1,
  "billing_key": "billing_key_from_step2",
  "customer_key": "customer_key_from_step2"
}
```

### 4. 결제 내역 조회
```
GET /v1/subscription/payments/{factory_id}
```
공장의 구독 결제 내역을 조회합니다.

### 5. 구독 상태 조회
```
GET /v1/subscription/status/{factory_id}
```
현재 구독 상태와 다음 결제일을 조회합니다.

### 6. 결제 취소
```
POST /v1/subscription/cancel/{payment_id}
```
완료된 결제를 취소합니다.

**Request Body:**
```json
{
  "cancel_reason": "고객 요청에 의한 취소",
  "cancel_amount": 50000  // 부분 취소 시에만 필요 (전체 취소는 생략)
}
```

### 7. 구독 갱신
```
POST /v1/subscription/renewal/{factory_id}
```
기존 빌링키를 사용해 구독을 자동 갱신합니다.

### 8. 웹훅 (내부용)
```
POST /v1/subscription/webhook/toss-payments
```
토스페이먼츠에서 결제 상태 변경 시 전송하는 웹훅을 처리합니다.

## 구독 결제 프로세스

### 1단계: 빌링키 발급
1. 고객이 카드 정보를 입력
2. `/billing-key/{factory_id}` API 호출
3. 토스페이먼츠에서 빌링키 발급

### 2단계: 구독 결제
1. 발급받은 빌링키로 `/payment/{factory_id}` API 호출
2. 구독 히스토리 및 결제 내역 생성
3. 토스페이먼츠 결제 API 호출

### 3단계: 자동 갱신
1. 매일 오전 6시에 cron job 실행
2. 만료 예정 구독 자동 갱신
3. 결제 실패 시 알림

## 오류 처리

### PaymentError
- 결제 관련 오류 (잔액 부족, 카드사 거부 등)
- HTTP 400 반환

### BillingKeyError
- 빌링키 관련 오류 (무효한 빌링키, 만료된 빌링키 등)
- HTTP 400 반환

### SubscriptionError
- 구독 관련 오류 (이미 활성 구독 존재 등)
- HTTP 400 반환

## 모니터링

### Cron Job
- `renew_subscriptions` 명령어로 수동 실행 가능
- `--dry-run` 옵션으로 테스트 실행
- `--days` 옵션으로 대상 일수 조정

### 로깅
- 모든 결제 관련 작업은 로그로 기록
- 성공/실패 상태 추적
- 웹훅 처리 상황 기록

## 환경 설정

settings.py에 다음 설정이 필요합니다:

```python
# 토스페이먼츠 설정
TOSS_PAYMENTS_SECRET_KEY = "your_secret_key"
TOSS_PAYMENTS_CLIENT_KEY = "your_client_key"  
TOSS_PAYMENTS_BASE_URL = "https://api.tosspayments.com"

# Cron Job 설정
CRONJOBS = [
    # 매일 오전 6시에 구독 자동 갱신
    ("0 6 * * *", "subscription.management.commands.renew_subscriptions.Command.handle", "--days=1"),
    # 당일 만료 구독 최종 갱신 시도
    ("30 6 * * *", "subscription.management.commands.renew_subscriptions.Command.handle", "--days=0"),
]
```
