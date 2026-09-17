"""
URL configuration for cfehome project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI
from ninja.errors import ValidationError
from api.docs import MixedDocs
from api.throttling import PartnerApiKeyThrottle
from aws.api import router as aws_router
from user.api import router as user_router
from stock.api import router as stock_router
from stock.api_material import router as material_router
from stock.api_material_history import router as materialHistory_router
from stock.api_material_history_v2 import router as materialHistoryV2_router
from stock.api_material_product import router as materialProduct_router
from factory.api import router as factory_router
from factory.api_member import router as factoryMember_router
from factory.api_member_v2 import router as factoryMemberV2_router
from factory.api_eq import router as factoryEQ_router
from stock.api_product import router as stockProduct_router
from stock.api_product_history import router as stockProductHistory_router
from factory.api_client import router as factoryClient_router
from location.api import router as location_router
from document.api_quotation import router as quotation_router
from document.api_quotation_product import router as quotationProduct_router
from document.api_workinstruction import router as workInstruction_router
from project.api_project import router as project_router
from project.api_project_v2 import router as projectV2_router
from project.api_project_plan import router as projectPlan_router
from project.api_project_plan_v2 import router as projectPlanV2_router
from stock.api_material_usage import router as materialUsage_router
from project.api_project_log import router as projectLog_router
from project.api_project_refund import router as projectRefund_router
from barobill.api import router as barobill_router
from tax.api import router as tax_router
from tax.api_v2 import router as tax_v2_router
from tax.api_account import router as tax_account_router
from tax.api_account_payment import router as tax_account_payment_router
from tax.api_cash_receipt import router as cashReceipt_router
from subscription.api import router as subscription_router
from notification.api import router as notification_router
from scheduling.api import router as scheduling_router
from substitute.api import router as substitute_router
from repackaging.api import router as repackaging_router

from unit_conversion.api import router as unit_conversion_router
from django.contrib.admin.views.decorators import staff_member_required
from cfehome.views import websocket_test, websocket_test_local


def docs_auth_decorator(view):
    if settings.DEBUG:
        return view  # 개발 환경에서는 그냥 통과
    return staff_member_required(view)  # 운영에서는 관리자만


base_api = NinjaAPI(
    title="Factory X API",
    version="0.1.0",
    description="공장 관리 시스템 API",
    docs_url="/<engine>/",
    docs_decorator=docs_auth_decorator,
    docs=MixedDocs(),
)


@base_api.exception_handler(ValidationError)
def validation_error_handler(request, exc):
    resolver_match = getattr(request, "resolver_match", None)
    path_view = getattr(getattr(resolver_match, "func", None), "__self__", None)
    is_partner_api = any(
        request.method in operation.methods
        and any(
            isinstance(throttle, PartnerApiKeyThrottle)
            for throttle in operation.throttle_objects
        )
        for operation in getattr(path_view, "operations", ())
    )

    for error in exc.errors:
        if (
            is_partner_api
            and error.get("type") == "missing"
            and tuple(error.get("loc", ())) == ("query", "factory_id")
        ):
            return base_api.create_response(
                request,
                {"detail": "factory_id를 입력해야 합니다."},
                status=400,
            )

    return base_api.create_response(request, {"detail": exc.errors}, status=422)


@base_api.get("", include_in_schema=False)
def health_check_handler(request):
    return {"ping": "pong"}


base_api.add_router("v1/aws", aws_router)
base_api.add_router("v1/auth", user_router)
base_api.add_router("v1/stock/material-history", materialHistory_router)
base_api.add_router("v2/stock/material-history", materialHistoryV2_router)
base_api.add_router("v1/stock/product/history", stockProductHistory_router)
base_api.add_router("v1/stock/materialproduct", materialProduct_router)
base_api.add_router("v1/stock/material", material_router)
base_api.add_router("v1/stock/product", stockProduct_router)
base_api.add_router("v1/stock", stock_router)
base_api.add_router("v1/factory/member", factoryMember_router)
base_api.add_router("v2/factory/member", factoryMemberV2_router)
base_api.add_router("v1/factory/equipment", factoryEQ_router)
base_api.add_router("v1/factory/client", factoryClient_router)
base_api.add_router("v1/factory", factory_router)
base_api.add_router("v1/location", location_router)
base_api.add_router("v1/document/quotation/product", quotationProduct_router)
base_api.add_router("v1/document/quotation", quotation_router)
base_api.add_router("v1/document/work-instruction", workInstruction_router)
base_api.add_router("v1/project-plan", projectPlan_router)
base_api.add_router("v2/project-plan", projectPlanV2_router)
base_api.add_router("v1/project-log", projectLog_router)
base_api.add_router("v1/project-refund", projectRefund_router)
base_api.add_router("v2/project", projectV2_router)  # v2 프로젝트 API (더 구체적인 경로를 먼저 등록)
base_api.add_router("v1/project", project_router)  # v1 프로젝트 API
base_api.add_router("v2/material-usage", materialUsage_router)
base_api.add_router("v1/barobill", barobill_router)
base_api.add_router("v1/tax", tax_router)
base_api.add_router("v2/tax", tax_v2_router)
base_api.add_router("v2/account", tax_account_router)
base_api.add_router("v2/account-payment", tax_account_payment_router)
base_api.add_router("v1/receipt", cashReceipt_router)
base_api.add_router("v1/subscription", subscription_router)
base_api.add_router("v1/notification", notification_router)
base_api.add_router("v1/scheduling", scheduling_router)
base_api.add_router("v2/substitute", substitute_router)
base_api.add_router("v2/unit-conversion", unit_conversion_router)
base_api.add_router("v2/repackaging", repackaging_router)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("notification/", websocket_test, name="websocket_test"),
    path("notification/local", websocket_test_local, name="websocket_test"),
    path("", base_api.urls),
]
