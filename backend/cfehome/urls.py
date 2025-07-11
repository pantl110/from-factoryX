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

from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI
from api.docs import MixedDocs
from aws.api import router as aws_router
from user.api import router as user_router
from stock.api import router as stock_router
from stock.api_material import router as material_router
from stock.api_material_history import router as material_history_router
from factory.api import router as factory_router
from factory.api_eq import router as factoryEQ_router
from stock.api_product import router as stockProduct_router
from stock.api_product_history import router as stockProductHistory_router
from stock.api_material import router as material_router
from stock.api_material_history import router as material_history_router
from factory.api_client import router as factory_client_router
from location.api import router as location_router
from document.api_quotation import router as quotation_router
from document.api_quotation_product import router as quotation_product_router
from project.api import router as project_router
from django.contrib.admin.views.decorators import staff_member_required

base_api = NinjaAPI(
    title="Factory X API",
    version="0.1.0",
    description="공장 관리 시스템 API",
    docs_url="/<engine>/",
    # docs_decorator=staff_member_required,  # 개발용으로 주석 처리
    docs=MixedDocs(),
)


@base_api.get("", include_in_schema=False)
def health_check_handler(request):
    return {"ping": "pong"}


base_api.add_router("v1/aws", aws_router)
base_api.add_router("v1/auth", user_router)
base_api.add_router("v1/stock", stock_router)
base_api.add_router("v1/stock/material", material_router)
base_api.add_router("v1/stock/material/history", material_history_router)
base_api.add_router("v1/factory", factory_router)
base_api.add_router("v1/factory/equipment", factoryEQ_router)
base_api.add_router("v1/stock/product", stockProduct_router)
base_api.add_router("v1/stock/product/history", stockProductHistory_router)
base_api.add_router("v1/factory/client", factory_client_router)
base_api.add_router("v1/location", location_router)
base_api.add_router("v1/document/quotation", quotation_router)
base_api.add_router("v1/document/quotation/product", quotation_product_router)
base_api.add_router("v1/project", project_router)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", base_api.urls),
]
