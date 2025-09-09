"""
토스 페이먼츠 구독 결제 API 사용 예제

이 파일은 프론트엔드 개발자를 위한 API 사용 예제를 제공합니다.
"""

# ==================== 1. 플랜 목록 조회 ====================
"""
GET /v1/subscription

Response:
{
  "data": [
    {
      "id": 1,
      "type": "basic",
      "price": 50000,
      "tax_invoice_count": 100,
      "created_at": "2025-08-23T10:00:00Z",
      "updated_at": "2025-08-23T10:00:00Z"
    },
    {
      "id": 2,
      "type": "partners",
      "price": 100000,
      "tax_invoice_count": 500,
      "created_at": "2025-08-23T10:00:00Z",
      "updated_at": "2025-08-23T10:00:00Z"
    }
  ]
}
"""

# ==================== 2. 빌링키 발급 ====================
"""
POST /v1/subscription/billing-key/1
Headers: Authorization: Bearer {JWT_TOKEN}

Request:
{
  "card_number": "4330123456781234",
  "card_expiry_year": "25",
  "card_expiry_month": "12",
  "card_password": "12",
  "customer_identity_number": "950101"
}

Response (201):
{
  "billing_key": "BX_billing_key_abc123def456",
  "customer_key": "factory_1_user_123_abc12345",
  "card_company": "현대카드",
  "card_type": "신용",
  "card_number": "433012******1234"
}
"""

# ==================== 3. 구독 결제 ====================
"""
POST /v1/subscription/payment/1
Headers: Authorization: Bearer {JWT_TOKEN}

Request:
{
  "subscription_id": 1,
  "billing_key": "BX_billing_key_abc123def456",
  "customer_key": "factory_1_user_123_abc12345"
}

Response (200):
{
  "payment_key": "tgen_20250823100000abc123",
  "order_id": "subscription_1_1724400000",
  "amount": 50000,
  "status": "DONE",
  "approved_at": "2025-08-23T10:30:00Z",
  "method": "카드"
}
"""

# ==================== 4. 결제 내역 조회 ====================
"""
GET /v1/subscription/payments/1
Headers: Authorization: Bearer {JWT_TOKEN}

Response:
{
  "data": [
    {
      "id": 1,
      "payment_key": "tgen_20250823100000abc123",
      "order_id": "subscription_1_1724400000",
      "amount": "50000.00",
      "status": "DONE",
      "method": "카드",
      "approved_at": "2025-08-23T10:30:00Z",
      "failure_code": null,
      "failure_message": null,
      "created_at": "2025-08-23T10:30:00Z",
      "updated_at": "2025-08-23T10:30:00Z"
    }
  ],
  "count": 1,
  "totalCnt": 1,
  "curPage": 1
}
"""

# ==================== 5. 구독 상태 조회 ====================
"""
GET /v1/subscription/status/1
Headers: Authorization: Bearer {JWT_TOKEN}

Response:
{
  "subscription_history": {
    "id": 1,
    "start_date": "2025-08-23",
    "end_date": "2025-09-23",
    "billing_key": "BX_billing_key_abc123def456",
    "customer_key": "factory_1_user_123_abc12345",
    "subscription": {
      "id": 1,
      "type": "basic",
      "price": 50000,
      "tax_invoice_count": 100
    },
    "created_at": "2025-08-23T10:30:00Z",
    "updated_at": "2025-08-23T10:30:00Z"
  },
  "current_payment": {
    "id": 1,
    "payment_key": "tgen_20250823100000abc123",
    "order_id": "subscription_1_1724400000",
    "amount": "50000.00",
    "status": "DONE",
    "method": "카드",
    "approved_at": "2025-08-23T10:30:00Z",
    "created_at": "2025-08-23T10:30:00Z",
    "updated_at": "2025-08-23T10:30:00Z"
  },
  "next_billing_date": "2025-09-23",
  "is_active": true
}
"""

# ==================== 6. 결제 취소 ====================
"""
POST /v1/subscription/cancel/1
Headers: Authorization: Bearer {JWT_TOKEN}

Request:
{
  "cancel_reason": "고객 요청에 의한 취소"
}

Response:
{
  "payment_key": "tgen_20250823100000abc123",
  "cancel_amount": 50000,
  "cancel_reason": "고객 요청에 의한 취소",
  "canceled_at": "2025-08-23T15:00:00Z"
}
"""

# ==================== 7. 구독 갱신 ====================
"""
POST /v1/subscription/renewal/1
Headers: Authorization: Bearer {JWT_TOKEN}

Response:
{
  "payment_key": "tgen_20250923100000def456",
  "order_id": "subscription_1_1726800000",
  "amount": 50000,
  "status": "DONE",
  "approved_at": "2025-09-20T06:00:00Z",
  "method": "카드"
}
"""

# ==================== JavaScript 사용 예제 ====================
"""
// 1. 빌링키 발급 및 구독 결제 플로우
async function subscribeToService(factoryId, subscriptionId, cardInfo) {
  try {
    // 1단계: 빌링키 발급
    const billingKeyResponse = await fetch(`/v1/subscription/billing-key/${factoryId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getJWTToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        card_number: cardInfo.number,
        card_expiry_year: cardInfo.expiryYear,
        card_expiry_month: cardInfo.expiryMonth,
        card_password: cardInfo.password,
        customer_identity_number: cardInfo.identityNumber
      })
    });

    if (!billingKeyResponse.ok) {
      throw new Error('빌링키 발급 실패');
    }

    const billingKeyData = await billingKeyResponse.json();

    // 2단계: 구독 결제
    const paymentResponse = await fetch(`/v1/subscription/payment/${factoryId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getJWTToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription_id: subscriptionId,
        billing_key: billingKeyData.billing_key,
        customer_key: billingKeyData.customer_key
      })
    });

    if (!paymentResponse.ok) {
      throw new Error('구독 결제 실패');
    }

    const paymentData = await paymentResponse.json();
    console.log('구독 결제 성공:', paymentData);

    return {
      success: true,
      paymentKey: paymentData.payment_key,
      amount: paymentData.amount
    };

  } catch (error) {
    console.error('구독 처리 오류:', error);
    return { success: false, error: error.message };
  }
}

// 2. 구독 상태 확인
async function checkSubscriptionStatus(factoryId) {
  try {
    const response = await fetch(`/v1/subscription/status/${factoryId}`, {
      headers: {
        'Authorization': `Bearer ${getJWTToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('구독 상태 조회 실패');
    }

    const data = await response.json();
    return {
      isActive: data.is_active,
      nextBillingDate: data.next_billing_date,
      currentPlan: data.subscription_history.subscription.type,
      price: data.subscription_history.subscription.price
    };

  } catch (error) {
    console.error('구독 상태 조회 오류:', error);
    return null;
  }
}

// 3. 결제 내역 조회
async function getPaymentHistory(factoryId, page = 1) {
  try {
    const response = await fetch(`/v1/subscription/payments/${factoryId}?offset=${(page-1)*20}&limit=20`, {
      headers: {
        'Authorization': `Bearer ${getJWTToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('결제 내역 조회 실패');
    }

    const data = await response.json();
    return {
      payments: data.data,
      totalCount: data.totalCnt,
      currentPage: data.curPage
    };

  } catch (error) {
    console.error('결제 내역 조회 오류:', error);
    return null;
  }
}

// JWT 토큰 획득 함수 (예시)
function getJWTToken() {
  // 실제 구현에서는 로그인 시 받은 토큰을 localStorage나 cookie에서 가져옴
  return localStorage.getItem('jwt_token');
}
"""
