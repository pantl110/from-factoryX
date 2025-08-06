'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import usePageStatusStore from '@/store/page-status-store';
import { useGetProjectStatus } from '@/hooks';
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
import Spinner from '@/ui/spinner';

const getTabsByStatus = (status: ProjectStatusType): ProductionTabType[] => {
  if (status === 'pending' || status === '생산 대기')
    return ['생산 계획', '주문서'];
  if (status === 'production' || status === '생산 중')
    return ['생산 현황', '생산 계획', '주문서'];
  if (status === 'manufactured' || status === '생산 완료')
    return ['생산 현황', '생산 내역', '주문서'];
  if (status === 'delivery' || status === '납품')
    return ['납품', '생산 현황', '생산 내역', '주문서'];
  if (status === 'completed' || status === '프로젝트 완료')
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
  const { getProjectStatus, isLoading } = useGetProjectStatus();
  const setPageStatus = usePageStatusStore((state) => state.setPageStatus);
  const [selectedTab, setSelectedTab] = useState(0);
  const setProductionTab = usePageStatusStore(
    (state) => state.setProductionTab
  );

  // 프로젝트 상태 데이터
  const [projectStatus, setProjectStatus] = useState<{
    project_id: number;
    status: string;
    created_at: string;
    updated_at: string;
    start_date?: string;
    end_date?: string;
    due_date?: string;
  } | null>(null);

  // 견적서 데이터 가져오기 (거래처 정보와 품목 정보 포함)
  const { data: quotationData } = useGetDetailQuotation(projectId);

  // 프로젝트 상태 로드 및 store 업데이트
  useEffect(() => {
    if (!projectId) return;

    const loadProjectStatus = async () => {
      try {
        const result = await getProjectStatus(projectId);
        if (result.success && result.data) {
          setProjectStatus(result.data);
          // 프로젝트 상태를 store에 업데이트
          const projectStatus = result.data.status as ProjectStatusType;
          const tabs = getTabsByStatus(projectStatus);

          setPageStatus(projectStatus);
          setProductionTab(tabs[selectedTab]);
        } else {
          alert('프로젝트 상태 로드 실패');
        }
      } catch {
        alert('프로젝트 상태 로드 중 오류');
      }
    };

    loadProjectStatus();
  }, [
    projectId,
    getProjectStatus,
    selectedTab,
    setPageStatus,
    setProductionTab,
  ]);

  const projectStatusType =
    (projectStatus?.status as ProjectStatusType) || 'quotation';
  const tabs = getTabsByStatus(projectStatusType);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-60px)]">
        <Spinner />
      </div>
    );
  }

  if (!projectStatus || !projectId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-60px)]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <ProductFlowTitle
        status={projectStatusType}
        tabs={tabs}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        // 보여줄 정보
        companyName={quotationData?.factory_name || '-'}
        dueDate={quotationData?.due_date || '-'}
        startDate={projectStatus?.start_date || ''}
        endDate={projectStatus?.end_date || ''}
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
            dueDate={quotationData.due_date || '-'}
            productListInfoTitle="주문 품목 정보"
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
