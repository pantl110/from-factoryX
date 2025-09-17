# services.py
import requests
import base64
from django.conf import settings
from subscription.models import Subscription, Payment
import uuid
import logging
from subscription.exceptions import PaymentError, BillingKeyError
from django.db import transaction
from django.utils import timezone
from dateutil.relativedelta import relativedelta


logger = logging.getLogger(__name__)


class TossPaymentsService:
    def __init__(self):
        self.secret_key = settings.TOSS_PAYMENTS_SECRET_KEY
        self.base_url = settings.TOSS_PAYMENTS_BASE_URL
        self.headers = {
            "Authorization": f"Basic {self._get_auth_header()}",
            "Content-Type": "application/json",
        }

    def _get_auth_header(self):
        """Basic Auth 헤더 생성"""
        credentials = f"{self.secret_key}:"
        return base64.b64encode(credentials.encode()).decode()

    # def issue_billing_key(
    #     self,
    #     customer_key,
    #     card_number,
    #     card_expiry_year,
    #     card_expiry_month,
    #     card_password,
    #     customer_identity_number,
    # ):
    #     """빌링키 발급"""
    #     url = f"{self.base_url}/v1/billing/authorizations/issue"

    #     data = {
    #         "customerKey": customer_key,
    #         "cardNumber": card_number,
    #         "cardExpirationYear": card_expiry_year,
    #         "cardExpirationMonth": card_expiry_month,
    #         "cardPassword": card_password,
    #         "customerIdentityNumber": customer_identity_number,
    #     }

    #     try:
    #         response = requests.post(url, json=data, headers=self.headers)
    #         response.raise_for_status()
    #         return response.json()
    #     except requests.exceptions.RequestException as e:
    #         raise Exception(f"빌링키 발급 실패: {str(e)}")

    def issue_billing_key(self, auth_key, customer_key):
        """성공 콜백으로 받은 authKey를 billingKey로 교환하여 발급"""
        url = f"{self.base_url}/v1/billing/authorizations"

        data = {
            "authKey": auth_key,
            "customerKey": customer_key,
        }

        try:
            response = requests.post(url, json=data, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"빌링키 발급 실패: {str(e)}")

    def delete_billing_key(self, billing_key, customer_key):
        """빌링키 삭제"""
        url = f"{self.base_url}/v1/billing/authorizations/{billing_key}"

        data = {"customerKey": customer_key}

        try:
            response = requests.delete(url, json=data, headers=self.headers)
            if response.status_code in [200, 204]:
                return {
                    "success": True,
                    "message": "빌링키가 성공적으로 삭제되었습니다.",
                }

            # 에러 응답 처리
            error_data = response.json() if response.content else {}
            error_message = error_data.get("message", "빌링키 삭제 실패")
            raise Exception(f"빌링키 삭제 실패: {error_message}")

        except requests.exceptions.RequestException as e:
            raise Exception(f"빌링키 삭제 실패: {str(e)}")

    def confirm_billing_key(self, billing_key, customer_key):
        """빌링키 확인"""
        url = f"{self.base_url}/v1/billing/authorizations/issue"

        data = {"billingKey": billing_key, "customerKey": customer_key}

        try:
            response = requests.post(url, json=data, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"빌링키 확인 실패: {str(e)}")

    def request_billing_payment(
        self, billing_key, customer_key, amount, order_id, order_name
    ):
        """빌링키를 사용한 정기 결제 요청 (개선된 버전)"""
        url = f"{self.base_url}/v1/billing/{billing_key}"

        data = {
            "customerKey": customer_key,
            "amount": amount,
            "orderId": order_id,
            "orderName": order_name,
        }

        try:
            response = requests.post(url, json=data, headers=self.headers, timeout=30)

            if response.status_code == 200:
                return response.json()

            # 에러 응답 처리
            error_data = response.json() if response.content else {}
            error_code = error_data.get("code")
            error_message = error_data.get("message", "알 수 없는 오류")

            logger.error(f"토스페이먼츠 API 오류: {error_code} - {error_message}")

            # 에러 코드별 처리
            if error_code in ["INVALID_BILLING_KEY", "EXPIRED_BILLING_KEY"]:
                raise BillingKeyError(f"빌링키 오류: {error_message}")
            elif error_code in ["INSUFFICIENT_FUNDS", "CARD_COMPANY_DECLINE"]:
                raise PaymentError(f"결제 실패: {error_message}", error_code)
            else:
                raise PaymentError(f"결제 요청 실패: {error_message}", error_code)

        except requests.exceptions.Timeout:
            raise PaymentError("결제 요청 시간 초과")
        except requests.exceptions.ConnectionError:
            raise PaymentError("결제 서버 연결 실패")
        except requests.exceptions.RequestException as e:
            raise PaymentError(f"결제 요청 오류: {str(e)}")

    def cancel_payment(self, payment_key, cancel_reason, cancel_amount=None):
        """결제 취소"""
        url = f"{self.base_url}/v1/payments/{payment_key}/cancel"

        data = {
            "cancelReason": cancel_reason,
        }

        if cancel_amount:
            data["cancelAmount"] = cancel_amount

        try:
            response = requests.post(url, json=data, headers=self.headers, timeout=30)

            if response.status_code == 200:
                return response.json()

            # 에러 응답 처리
            error_data = response.json() if response.content else {}
            error_code = error_data.get("code")
            error_message = error_data.get("message", "알 수 없는 오류")

            logger.error(f"토스페이먼츠 취소 API 오류: {error_code} - {error_message}")
            raise PaymentError(f"결제 취소 실패: {error_message}", error_code)

        except requests.exceptions.Timeout:
            raise PaymentError("결제 취소 요청 시간 초과")
        except requests.exceptions.ConnectionError:
            raise PaymentError("결제 서버 연결 실패")
        except requests.exceptions.RequestException as e:
            raise PaymentError(f"결제 취소 요청 오류: {str(e)}")

    def get_payment_info(self, payment_key):
        """결제 정보 조회"""
        url = f"{self.base_url}/v1/payments/{payment_key}"

        try:
            response = requests.get(url, headers=self.headers, timeout=30)

            if response.status_code == 200:
                return response.json()

            # 에러 응답 처리
            error_data = response.json() if response.content else {}
            error_code = error_data.get("code")
            error_message = error_data.get("message", "알 수 없는 오류")

            logger.error(f"토스페이먼츠 조회 API 오류: {error_code} - {error_message}")
            raise PaymentError(f"결제 정보 조회 실패: {error_message}", error_code)

        except requests.exceptions.Timeout:
            raise PaymentError("결제 정보 조회 시간 초과")
        except requests.exceptions.ConnectionError:
            raise PaymentError("결제 서버 연결 실패")
        except requests.exceptions.RequestException as e:
            raise PaymentError(f"결제 정보 조회 오류: {str(e)}")


class SubscriptionBillingService:

    def __init__(self):
        self.toss_service = TossPaymentsService()

    @transaction.atomic
    def process_subscription_payment(self, subscription_history):
        """구독 정기 결제 처리 (트랜잭션 적용)"""
        order_id = (
            f"subscription_{subscription_history.id}_{int(timezone.now().timestamp())}"
        )

        # Payment 객체 먼저 생성 (PENDING 상태)
        payment = Payment.objects.create(
            subscription_history=subscription_history,
            order_id=order_id,
            amount=subscription_history.subscription.price,
            status="PENDING",
        )

        try:
            # 토스페이먼츠 API 호출
            payment_result = self.toss_service.request_billing_payment(
                billing_key=subscription_history.billing_key,
                customer_key=subscription_history.customer_key,
                amount=int(subscription_history.subscription.price),
                order_id=order_id,
                order_name=f"{subscription_history.subscription.type} 구독료",
            )

            # 결제 성공 시 업데이트
            payment.payment_key = payment_result.get("paymentKey")
            payment.status = "DONE"
            payment.method = payment_result.get("method")
            payment.approved_at = timezone.now()

            # 카드 정보 저장
            card_info = payment_result.get("card", {})
            payment.card_company = card_info.get("company")
            payment.card_type = card_info.get("cardType")
            payment.card_number = card_info.get("number")
            payment.card_owner_type = card_info.get("ownerType")

            payment.save()

            # 다음 결제일 업데이트
            self._update_next_billing_date(subscription_history)

            logger.info(
                f"구독 결제 성공: {subscription_history.id} - {payment.payment_key}"
            )
            return payment

        except Exception as e:
            # 결제 실패 시 Payment 상태 업데이트
            payment.status = "FAILED"
            payment.failure_message = str(e)
            payment.save()

            logger.error(f"구독 결제 실패: {subscription_history.id} - {str(e)}")
            raise e

    def _update_next_billing_date(self, subscription_history):
        """다음 결제일 업데이트"""
        subscription_history.start_date += relativedelta(months=1)
        subscription_history.end_date += relativedelta(months=1)

        subscription_history.save()
