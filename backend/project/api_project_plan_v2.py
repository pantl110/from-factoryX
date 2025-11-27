from ninja import Router, Query
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from django.db import models
from datetime import datetime, timedelta
from django.utils import timezone
from typing import List
from project.schemas.outbound import MobileDashboardCountOut
from project.models import Project, ProjectPlan
from document.models import QuotationProduct
from stock.models import Material
from stock.utils import get_expiry_status
from factory.utils import is_factory_member

router = Router(tags=["ProjectPlan V2"], auth=jwt_auth)


@router.get(
    "/dashboard-mobile",
    summary="[C] 모바일 대시보드 지표 조회",
    description="모바일 대시보드에서 필요한 핵심 지표 수량을 반환합니다.",
    response={200: MobileDashboardCountOut, 400: dict, 500: dict},
)
async def get_mobile_dashboard_counts(
    request,
    base_date: str | None = Query(
        None, description="납품 예정 품목 조회 기준 날짜 (YYYY-MM-DD)"
    ),
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    parsed_base_date = None
    if base_date:
        try:
            parsed_base_date = datetime.strptime(base_date, "%Y-%m-%d").date()
        except ValueError:
            raise HttpError(400, "base_date는 YYYY-MM-DD 형식이어야 합니다.")

    try:

        @sync_to_async
        def calculate_counts():
            # 1. 납품되지 않은 견적서 품목 수 (기존 엔드포인트 조건과 동일)
            if parsed_base_date:
                week_later = parsed_base_date + timedelta(days=7)
                undelivered_qs = QuotationProduct.objects.filter(
                    quotation__factory_id=int(factory_id),
                    quotation__project__status__in=[
                        "pending",
                        "production",
                        "manufactured",
                        "delivery",
                    ],
                    is_delivery=False,
                    quotation__due_date__range=(parsed_base_date, week_later),
                )
            else:
                undelivered_qs = QuotationProduct.objects.filter(
                    quotation__factory_id=int(factory_id),
                    quotation__project__status="delivery",
                    is_delivery=False,
                )
            undelivered_count = undelivered_qs.count()

            # 2. 부족 원자재 수 (status=shortage 조건과 동일)
            shortage_count = Material.objects.filter(
                factory_id=int(factory_id), current_stock__lt=models.F("standard_stock")
            ).count()

            # 3. 유통기한 위험 원자재 수
            expiry_risk_count = 0
            for material in Material.objects.filter(factory_id=int(factory_id)):
                expiry_days = material.expiry_days or 7
                status = get_expiry_status(material.id, expiry_days)
                if status == "위험":
                    expiry_risk_count += 1

            # 4. 7일 이상 확정 상태 유지 중인 프로젝트 수
            today = timezone.localdate()
            cutoff_date = today - timedelta(days=7)
            stale_confirmed_count = (
                Project.objects.filter(
                    status=Project.ProjectStatus.confirmed,
                    confirmed_at__isnull=False,
                    confirmed_at__lte=cutoff_date,
                    quotations__factory_id=int(factory_id),
                )
                .distinct()
                .count()
            )

            return {
                "undelivered_quotation_products": undelivered_count,
                "shortage_materials": shortage_count,
                "expiry_risk_materials": expiry_risk_count,
                "stale_confirmed_projects": stale_confirmed_count,
            }

        counts = await calculate_counts()
        return 200, MobileDashboardCountOut(**counts)

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(
            500, f"모바일 대시보드 지표 조회 중 오류가 발생했습니다: {str(e)}"
        )


