from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from project.schemas.outbound import ProjectCreateOut, ProjectDetailOut, ProjectUpdateOut, ListProgressProjectOut
from project.schemas.inbound import ProjectStatusUpdateIn, ProjectTransactDateUpdateIn, ListProgressProjectIn
from project.models import Project
from document.models import Quotation
from typing import List

router = Router(tags=["Project"], auth=jwt_auth)

@router.post(
    "",
    summary="[C] 프로젝트 생성",
    description="프로젝트와 견적서를 동시에 생성합니다.",
    response={201: ProjectCreateOut, 500: dict}
)
async def create_project(request):
    try:
        new_project = await Project.objects.acreate()

        new_quotation = await Quotation.objects.acreate(
            project=new_project
        )

        return 201, {
            "id": new_quotation.id
        }

    except Exception as e:
        raise HttpError(500, "프로젝트 및 견적서 생성 중 내부 서버 오류가 발생했습니다.")


@router.delete(
    "/{project_id}",
    summary="[C] 프로젝트 삭제",
    description="프로젝트를 삭제합니다.",
    response={200: ProjectUpdateOut, 404: dict, 500: dict}
)
async def delete_project(request, project_id: int):
    try:
        project = await Project.objects.aget(id=project_id)
        await project.adelete()
        
        return 200, {"message": "프로젝트가 성공적으로 삭제되었습니다."}
        
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

    except Exception as e:
        raise HttpError(500, "프로젝트 삭제 중 내부 서버 오류가 발생했습니다.")


@router.patch(
    "/{project_id}/status",
    summary="[C] 프로젝트 상태 업데이트",
    description="프로젝트의 상태를 업데이트합니다.",
    response={200: ProjectDetailOut, 400: dict, 404: dict, 500: dict}
)
async def update_project_status(request, project_id: int, payload: ProjectStatusUpdateIn):
    valid_statuses = [choice[0] for choice in Project.ProjectStatus.choices]
    if payload.status not in valid_statuses:
        raise HttpError(400, "올바르지 않은 상태값입니다.")
    
    try:
        project = await Project.objects.aget(id=project_id)
        project.status = payload.status
        await project.asave()
        
        return 200, ProjectDetailOut(
            id=project.id,
            status=project.status,
            transact_date=project.transact_date,
            tax_invoice=project.tax_invoice.id if project.tax_invoice else None,
            created_at=project.created_at,
            updated_at=project.updated_at
        )
        
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

    except Exception as e:
        raise HttpError(500, "프로젝트 상태 업데이트 중 내부 서버 오류가 발생했습니다.")


@router.patch(
    "/{project_id}/transact-date",
    summary="[C] 거래명세서 발급일 업데이트",
    description="프로젝트의 거래명세서 발급일을 업데이트합니다.",
    response={200: ProjectDetailOut, 404: dict, 500: dict}
)
async def update_project_transact_date(request, project_id: int, payload: ProjectTransactDateUpdateIn):
    try:
        project = await Project.objects.aget(id=project_id)
        project.transact_date = payload.transact_date
        await project.asave()
        
        return 200, ProjectDetailOut(
            id=project.id,
            status=project.status,
            transact_date=project.transact_date,
            tax_invoice=project.tax_invoice.id if project.tax_invoice else None,
            created_at=project.created_at,
            updated_at=project.updated_at
        )
        
    except Project.DoesNotExist:
        raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

    except Exception as e:
        raise HttpError(500, "거래명세서 발급일 업데이트 중 내부 서버 오류가 발생했습니다.")


# Progress, Completed Project Tab
@router.get(
    "",
    summary="[C] 진행 중인 프로젝트 조회",
    description="진행 중인 프로젝트를 조회합니다.",
    response={200: List[ListProgressProjectOut], 400: dict, 500: dict}
)
@paginate
async def list_progress_project(request, factory_id: int = Query(...), status: str = Query(...)):
    """
    진행 중인 프로젝트 또는 완료된 프로젝트를 조회합니다.
    
    입력 필드:
    - factory_id: 공장 ID (필수)
    - status: 조회 상태 ("progress" 또는 "complete")
        - "progress": 완료 상태를 제외한 모든 프로젝트 조회
        - "complete": 완료된 프로젝트만 조회
    
    반환 필드:
    - project_id: 프로젝트 ID
    - client_name: 고객사명 (Quotation.FactoryClient.name)
    - product_names: 제품명 목록 (Quotation.QuotationProduct.Product.name 배열)
    - start_date: 생산 시작일 (ProjectPlan.start_date 중 가장 빠른 날짜)
    - due_date: 납기일자 (Quotation.due_date)
    - publish_status: 세금계산서 발행 상태 (Project.NationalTaxService.publish_status)
        - null: 세금계산서 미연결 ("연결 필요"로 표시)
        - "temporary": 임시 저장
        - "pending": 발행 대기
        - "published": 발행 완료
    
    예시:
    - 진행 중인 프로젝트: status="progress"
    - 완료된 프로젝트: status="complete"
    """
    try:
        if status not in ["progress", "complete"]:
            raise HttpError(400, "status는 'progress' 또는 'complete'여야 합니다.")
        
        @sync_to_async
        def get_projects():
            if status == "progress":
                projects = Project.objects.filter(
                    quotations__factory_id=factory_id
                ).exclude(
                    status=Project.ProjectStatus.completed
                ).prefetch_related(
                    'quotations__client',
                    'quotations__products__product',
                    'plans__product__product',
                    'tax_invoice'
                ).distinct()
            else:
                projects = Project.objects.filter(
                    quotations__factory_id=factory_id,
                    status=Project.ProjectStatus.completed
                ).prefetch_related(
                    'quotations__client',
                    'quotations__products__product',
                    'plans__product__product',
                    'tax_invoice'
                ).distinct()
            
            return list(projects)
        
        projects = await get_projects()
        result = []
        
        for project in projects:
            quotations = project.quotations.filter(factory_id=factory_id).prefetch_related(
                'client', 'products__product'
            )
            
            for quotation in quotations:
                product_names = []
                for quotation_product in quotation.products.all():
                    product_names.append(quotation_product.product.name)
                
                start_date = None
                plans = project.plans.all()
                if plans:
                    start_dates = [plan.start_date for plan in plans]
                    start_date = min(start_dates)
                
                # 세금계산서 상태 처리
                publish_status = None
                if project.tax_invoice:
                    publish_status = project.tax_invoice.publish_status
                
                result.append(ListProgressProjectOut(
                    project_id=project.id,
                    client_name=quotation.client.name if quotation.client else "",
                    product_names=product_names,
                    start_date=start_date or quotation.due_date,
                    due_date=quotation.due_date,
                    publish_status=publish_status
                ))
        
        return result
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, "프로젝트 조회 중 내부 서버 오류가 발생했습니다.")