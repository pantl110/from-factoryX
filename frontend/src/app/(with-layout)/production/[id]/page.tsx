'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import usePageStatusStore from '@/store/page-status-store';
import { useGetProjects } from '@/hooks';
import useGetDetailQuotation from '@/hooks/document/use-get-quotation';
import ProductFlowTitle from '../product-flow-title';
import ProductionPlan from '../production-plan';
import ProductionMonitor from '../production-monitor';
import ProductionLog from '../production-log';
import Delivery from '../delivery';
import TaxDocumentView from '../../document/tax-document-view';
import TransactionDocumentView from '../../document/transaction-document-view';
import OrderDocumentView from '../../document/order-document-view';
import { ProjectStatusType } from '@/types/status-type';
import { ProductionTabType } from '@/components/top-bar/types';
import { ProjectResponseModel } from '@/types/data-model';
import Spinner from '@/ui/spinner';

// 한글 상태를 영어로 매핑
const mapKoreanToEnglish = (koreanStatus: string): ProjectStatusType => {
  const statusMap: Record<string, ProjectStatusType> = {
    '견적 협의중': 'quotation',
    '주문 확정': 'confirmed',
    '생산 대기': 'pending',
    '생산 중': 'production',
    '생산 완료': 'manufactured',
    납품: 'delivery',
    '프로젝트 완료': 'completed',
    중단: 'interruption',
  };

  return statusMap[koreanStatus] || 'quotation'; // 기본값
};

const getTabsByStatus = (status: string): ProductionTabType[] => {
  if (status === '생산 대기') return ['생산 계획', '주문서'];
  if (status === '생산 중') return ['생산 현황', '생산 계획', '주문서'];
  if (status === '생산 완료') return ['생산 현황', '생산 내역', '주문서'];
  if (status === '납품') return ['납품', '생산 현황', '생산 내역', '주문서'];
  if (status === '프로젝트 완료')
    return [
      '세금계산서',
      '거래명세서',
      '납품',
      '생산 현황',
      '생산 내역',
      '주문서',
    ];
  return ['생산 계획', '주문서'];
};

const ProductionPageContent = () => {
  const params = useParams();
  const projectId = Number(params.id);
  const { getProjects, isLoading } = useGetProjects();
  const setPageStatus = usePageStatusStore((state) => state.setPageStatus); // 바뀐 프로젝트상태 전역상태로로관리 -> top-bar 상태에 적용
  const [selectedTab, setSelectedTab] = useState(0);
  const setProductionTab = usePageStatusStore(
    (state) => state.setProductionTab // 바뀐 탭 전역상태로관리 -> top-bar 상태에 적용
  );

  // 프로젝트 데이터 가져와서 상태 확인
  const [project, setProject] = useState<ProjectResponseModel | null>(null);

  // 견적서 데이터 가져오기 (거래처 정보와 품목 정보 포함)
  const { data: quotationData } = useGetDetailQuotation(projectId);

  // 프로젝트 데이터 로드
  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      try {
        // 상태별로 페이지네이션으로 검색하는 함수
        const searchInStatus = async (
          status: ProjectStatusType | 'archived' | 'progress'
        ) => {
          let page = 1;
          let foundProject = null;

          while (!foundProject) {
            const result = await getProjects({
              status,
              page,
              size: 50, // 적당한 페이지 크기
            });

            if (!result.success || !result.data) {
              break;
            }

            // 현재 페이지에서 프로젝트 검색
            foundProject = result.data.data.find(
              (p) => p.project_id === projectId
            );

            if (foundProject) {
              return foundProject;
            }

            // 다음 페이지가 없으면 중단
            if (!result.data.nextPage || page >= result.data.pageCnt) {
              break;
            }

            page++;
          }

          return null;
        };

        // 진행중인 프로젝트에서 검색
        let foundProject = await searchInStatus('progress');

        // 진행중에서 못 찾으면 보관된 프로젝트에서 검색
        if (!foundProject) {
          foundProject = await searchInStatus('archived');
        }

        setProject(foundProject || null);
      } catch (error) {
        console.error('Failed to load project:', error);
        setProject(null);
      }
    };

    loadProject();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const mappedStatus = project
    ? mapKoreanToEnglish(project.status)
    : 'quotation';
  const tabs = getTabsByStatus(project?.status || '');

  useEffect(() => {
    if (!project) return;
    const currentMappedStatus = mapKoreanToEnglish(project.status);
    const currentTabs = getTabsByStatus(project.status || '');
    setPageStatus(currentMappedStatus);
    setProductionTab(currentTabs[selectedTab]);
    return () => {
      setPageStatus(null);
      setProductionTab(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.status, selectedTab]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!project || !projectId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <ProductFlowTitle
        status={mappedStatus}
        tabs={tabs}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />

      {tabs[selectedTab] === '세금계산서' && (
        <div className="px-10 pt-5 pb-10">
          <TaxDocumentView taxType="매출" />
        </div>
      )}
      {tabs[selectedTab] === '거래명세서' && (
        <div className="px-10 pt-5 pb-10">
          <TransactionDocumentView />
        </div>
      )}
      {tabs[selectedTab] === '납품' && <Delivery />}
      {tabs[selectedTab] === '생산 현황' && <ProductionMonitor />}
      {tabs[selectedTab] === '생산 내역' && <ProductionLog />}
      {tabs[selectedTab] === '생산 계획' && <ProductionPlan />}
      {tabs[selectedTab] === '주문서' && quotationData && (
        <div className="px-10 pt-5 pb-10">
          <OrderDocumentView
            documentTitle="주문서"
            clientData={{
              name: quotationData.factory_name,
              business_registration_number:
                quotationData.business_registration_number,
              representative_name: quotationData.representative_name,
              address: quotationData.address,
              business_type: quotationData.business_type,
              business_category: quotationData.business_category,
            }}
            dueDate={project?.due_date || ''}
            productListInfoTitle="상품 목록"
            productItems={quotationData.products}
            supplyAmount={quotationData.products.reduce(
              (sum, item) => sum + (item.supply_amount || 0),
              0
            )}
          />
        </div>
      )}
    </div>
  );
};

const ProductionPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      }
    >
      <ProductionPageContent />
    </Suspense>
  );
};

export default ProductionPage;
