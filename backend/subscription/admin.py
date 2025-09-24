from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from subscription.models import Subscription, SubscriptionHistory, Payment, PaymentAuth


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "type",
        "price_display",
        "tax_invoice_count",
        "created_at_display",
    ]
    list_filter = ["type", "created_at"]
    search_fields = ["type"]
    ordering = ["type", "price"]
    readonly_fields = ["id", "created_at", "updated_at"]

    fieldsets = (
        ("기본 정보", {"fields": ("type", "price", "tax_invoice_count")}),
        (
            "시스템 정보",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def price_display(self, obj):
        return f"₩{obj.price:,}"

    price_display.short_description = "가격"

    def created_at_display(self, obj):
        return obj.created_at.strftime("%Y-%m-%d %H:%M")

    created_at_display.short_description = "생성일시"


@admin.register(SubscriptionHistory)
class SubscriptionHistoryAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "factory_link",
        "subscription_type",
        "period_display",
        "billing_status",
        "status_display",
        "created_at_display",
    ]
    list_filter = [
        "subscription__type",
        "is_canceled",
        "start_date",
        "end_date",
        "created_at",
    ]
    search_fields = [
        "factory__name",
        "factory__business_registration_number",
        "customer_key",
        "billing_key",
    ]
    date_hierarchy = "start_date"
    ordering = ["-created_at"]
    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
        "factory_info",
        "subscription_info",
        "billing_info",
    ]

    fieldsets = (
        (
            "구독 정보",
            {
                "fields": (
                    "factory",
                    "subscription",
                    "start_date",
                    "end_date",
                    "is_canceled",
                )
            },
        ),
        (
            "결제 정보",
            {
                "fields": ("billing_key", "customer_key", "auth_key"),
                "classes": ("collapse",),
            },
        ),
        (
            "상세 정보",
            {
                "fields": ("factory_info", "subscription_info", "billing_info"),
                "classes": ("collapse",),
            },
        ),
        (
            "시스템 정보",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def factory_link(self, obj):
        if obj.factory:
            url = reverse("admin:factory_factory_change", args=[obj.factory.id])
            return format_html('<a href="{}">{}</a>', url, obj.factory.name)
        return "-"

    factory_link.short_description = "공장"

    def subscription_type(self, obj):
        return obj.subscription.get_type_display()

    subscription_type.short_description = "구독 타입"

    def period_display(self, obj):
        return f"{obj.start_date} ~ {obj.end_date}"

    period_display.short_description = "구독 기간"

    def billing_status(self, obj):
        if obj.billing_key:
            return format_html('<span style="color: green;">✓ 빌링키 등록</span>')
        return format_html('<span style="color: red;">✗ 빌링키 없음</span>')

    billing_status.short_description = "빌링 상태"

    def status_display(self, obj):
        now = timezone.now().date()
        if obj.is_canceled:
            return format_html('<span style="color: orange;">취소됨</span>')
        elif obj.end_date < now:
            return format_html('<span style="color: red;">만료됨</span>')
        elif obj.start_date <= now <= obj.end_date:
            return format_html('<span style="color: green;">활성</span>')
        else:
            return format_html('<span style="color: blue;">예정</span>')

    status_display.short_description = "상태"

    def created_at_display(self, obj):
        return obj.created_at.strftime("%Y-%m-%d %H:%M")

    created_at_display.short_description = "생성일시"

    def factory_info(self, obj):
        if obj.factory:
            return format_html(
                "<strong>이름:</strong> {}<br>"
                "<strong>사업자번호:</strong> {}<br>"
                "<strong>대표자:</strong> {}",
                obj.factory.name,
                obj.factory.business_registration_number,
                obj.factory.representative_name,
            )
        return "-"

    factory_info.short_description = "공장 정보"

    def subscription_info(self, obj):
        return format_html(
            "<strong>타입:</strong> {}<br>"
            "<strong>가격:</strong> ₩{:,}<br>"
            "<strong>세금계산서 발행 제한:</strong> {}회",
            obj.subscription.get_type_display(),
            obj.subscription.price,
            obj.subscription.tax_invoice_count,
        )

    subscription_info.short_description = "구독 상세"

    def billing_info(self, obj):
        info = []
        if obj.billing_key:
            info.append(f"<strong>빌링키:</strong> {obj.billing_key[:20]}...")
        if obj.customer_key:
            info.append(f"<strong>고객키:</strong> {obj.customer_key}")
        if obj.auth_key:
            info.append(f"<strong>인증키:</strong> {obj.auth_key[:20]}...")
        return format_html("<br>".join(info)) if info else "-"

    billing_info.short_description = "빌링 정보"


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "subscription_factory",
        "order_id",
        "amount_display",
        "status_display",
        "method",
        "approved_at_display",
        "created_at_display",
    ]
    list_filter = [
        "status",
        "method",
        "approved_at",
        "created_at",
        "subscription_history__subscription__type",
    ]
    search_fields = [
        "payment_key",
        "order_id",
        "subscription_history__factory__name",
        "subscription_history__factory__business_registration_number",
    ]
    date_hierarchy = "approved_at"
    ordering = ["-created_at"]
    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
        "subscription_info",
        "card_info",
        "failure_info",
    ]

    fieldsets = (
        (
            "결제 정보",
            {
                "fields": (
                    "subscription_history",
                    "payment_key",
                    "order_id",
                    "amount",
                    "status",
                )
            },
        ),
        (
            "결제 상세",
            {
                "fields": ("method", "approved_at"),
            },
        ),
        (
            "카드 정보",
            {
                "fields": (
                    "card_company",
                    "card_type",
                    "card_number",
                    "card_owner_type",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "실패 정보",
            {"fields": ("failure_code", "failure_message"), "classes": ("collapse",)},
        ),
        (
            "상세 정보",
            {
                "fields": ("subscription_info", "card_info", "failure_info"),
                "classes": ("collapse",),
            },
        ),
        (
            "시스템 정보",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def subscription_factory(self, obj):
        factory = obj.subscription_history.factory
        if factory:
            url = reverse("admin:factory_factory_change", args=[factory.id])
            return format_html('<a href="{}">{}</a>', url, factory.name)
        return "-"

    subscription_factory.short_description = "공장"

    def amount_display(self, obj):
        return f"₩{obj.amount:,}"

    amount_display.short_description = "금액"

    def status_display(self, obj):
        colors = {
            "PENDING": "orange",
            "DONE": "green",
            "CANCELED": "red",
            "FAILED": "red",
        }
        color = colors.get(obj.status, "black")
        return format_html(
            '<span style="color: {};">{}</span>', color, obj.get_status_display()
        )

    status_display.short_description = "상태"

    def approved_at_display(self, obj):
        if obj.approved_at:
            return obj.approved_at.strftime("%Y-%m-%d %H:%M")
        return "-"

    approved_at_display.short_description = "승인일시"

    def created_at_display(self, obj):
        return obj.created_at.strftime("%Y-%m-%d %H:%M")

    created_at_display.short_description = "생성일시"

    def subscription_info(self, obj):
        subscription = obj.subscription_history.subscription
        factory = obj.subscription_history.factory
        return format_html(
            "<strong>공장:</strong> {}<br>"
            "<strong>구독 타입:</strong> {}<br>"
            "<strong>구독 기간:</strong> {} ~ {}",
            factory.name if factory else "-",
            subscription.get_type_display(),
            obj.subscription_history.start_date,
            obj.subscription_history.end_date,
        )

    subscription_info.short_description = "구독 정보"

    def card_info(self, obj):
        if not any([obj.card_company, obj.card_type, obj.card_number]):
            return "-"
        return format_html(
            "<strong>카드사:</strong> {}<br>"
            "<strong>카드 타입:</strong> {}<br>"
            "<strong>카드 번호:</strong> {}<br>"
            "<strong>소유자 타입:</strong> {}",
            obj.card_company or "-",
            obj.card_type or "-",
            obj.card_number or "-",
            obj.card_owner_type or "-",
        )

    card_info.short_description = "카드 상세"

    def failure_info(self, obj):
        if not any([obj.failure_code, obj.failure_message]):
            return "-"
        return format_html(
            "<strong>실패 코드:</strong> {}<br>" "<strong>실패 메시지:</strong> {}",
            obj.failure_code or "-",
            obj.failure_message or "-",
        )

    failure_info.short_description = "실패 상세"


@admin.register(PaymentAuth)
class PaymentAuthAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "factory_link",
        "customer_key",
        "billing_key_display",
        # "auth_key_display",
        "card_company",
        "card_number",
        "created_at_display",
    ]
    list_filter = ["created_at", "updated_at"]
    search_fields = [
        "factory__name",
        "factory__business_registration_number",
        "customer_key",
        "billing_key",
        "card_company",
    ]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at", "factory_info", "auth_summary"]

    fieldsets = (
        ("기본 정보", {"fields": ("factory", "customer_key")}),
        (
            # "인증 정보",
            "카드 정보",
            {
                # "fields": ("auth_key", "billing_key"),
                # "description": "보안이 중요한 정보입니다. 필요한 경우에만 확인하세요.",
                "fields": ("card_company", "card_number"),
                "description": "카드 정보입니다.",
            },
        ),
        (
            "상세 정보",
            {"fields": ("factory_info", "auth_summary"), "classes": ("collapse",)},
        ),
        (
            "시스템 정보",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def factory_link(self, obj):
        if obj.factory:
            url = reverse("admin:factory_factory_change", args=[obj.factory.id])
            return format_html('<a href="{}">{}</a>', url, obj.factory.name)
        return "-"

    factory_link.short_description = "공장"

    def billing_key_display(self, obj):
        if obj.billing_key:
            return f"{obj.billing_key[:15]}..."
        return "-"

    billing_key_display.short_description = "빌링키"

    # def auth_key_display(self, obj):
    #     if obj.auth_key:
    #         return f"{obj.auth_key[:15]}..."
    #     return "-"
    
    def card_company_display(self, obj):
        return obj.card_company or "-"

    card_company_display.short_description = "카드사"

    def created_at_display(self, obj):
        return obj.created_at.strftime("%Y-%m-%d %H:%M")

    created_at_display.short_description = "생성일시"

    def factory_info(self, obj):
        if obj.factory:
            return format_html(
                "<strong>공장명:</strong> {}<br>"
                "<strong>사업자번호:</strong> {}<br>"
                "<strong>대표자:</strong> {}<br>"
                "<strong>관리자 이메일:</strong> {}",
                obj.factory.name,
                obj.factory.business_registration_number,
                obj.factory.representative_name,
                obj.factory.manager_email,
            )
        return "-"

    factory_info.short_description = "공장 상세"

    def auth_summary(self, obj):
        return format_html(
            "<strong>고객키:</strong> {}<br>"
            "<strong>빌링키:</strong> {}<br>"
            # "<strong>인증키:</strong> {}<br>"
            "<strong>카드사:</strong> {}<br>"
            "<strong>카드번호:</strong> {}",
            # obj.customer_key,
            f"{obj.billing_key[:20]}..." if obj.billing_key else "-",
            # f"{obj.auth_key[:20]}..." if obj.auth_key else "-",
            obj.card_company or "-",
            obj.card_number or "-",
        )

    auth_summary.short_description = "인증 정보 요약"


# 추가 커스터마이제이션
admin.site.site_header = "Factory X 구독 관리"
admin.site.site_title = "Factory X Admin"
admin.site.index_title = "구독 서비스 관리"
