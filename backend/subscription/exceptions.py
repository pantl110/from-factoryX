class PaymentError(Exception):
    """결제 관련 에러"""

    def __init__(self, message, error_code=None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class BillingKeyError(Exception):
    """빌링키 관련 에러"""

    pass


class SubscriptionError(Exception):
    """구독 관련 에러"""

    pass
