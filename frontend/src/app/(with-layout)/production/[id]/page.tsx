'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';
import usePageStatusStore from '@/store/page-status-store';
import { useGetProjectStatus, useGetDetailQuotation } from '@/hooks';
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
import useUpdateProjectStatus from '@/hooks/project/use-update-project-status';
import AddReturnModal from '../delivery/modals/add-return-modal/add-return-modal';
import {
  ProjectStatusResponseModel,
  QuotationProductDetailResponseModel,
} from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';

const getTabsByStatus = (
  status: ProjectStatusType,
  isRefund: boolean
): ProductionTabType[] => {
  if (status === 'pending') return ['생산 계획', '주문서'];
  if (status === 'production')
    return isRefund
      ? ['납품', '생산 현황', '생산 계획', '주문서']
      : ['생산 현황', '생산 계획', '주문서'];
  if (status === 'manufactured')
    return isRefund
      ? ['납품', '생산 현황', '생산 내역', '주문서']
      : ['생산 현황', '생산 내역', '주문서'];
  if (status === 'delivery')
    return ['납품', '생산 현황', '생산 내역', '주문서'];
  if (status === 'completed')
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
  const { updateProjectStatus } = useUpdateProjectStatus();
  const setPageStatus = usePageStatusStore((state) => state.setPageStatus);
  const [selectedTab, setSelectedTab] = useState(0);
  const setProductionTab = usePageStatusStore(
    (state) => state.setProductionTab
  );
  const setIsRefund = usePageStatusStore((state) => state.setIsRefund);

  // 프로젝트 상태 데이터
  const [projectStatus, setProjectStatus] =
    useState<ProjectStatusResponseModel | null>(null);

  // 견적서 데이터 가져오기 (거래처 정보와 품목 정보 포함)
  const { data: quotationData } = useGetDetailQuotation(
    projectStatus?.quotation_id || projectId
  );

  // 프로젝트 상태 로드 및 store 업데이트
  useEffect(() => {
    if (!projectId) return;

    const loadProjectStatus = async () => {
      try {
        const result = await getProjectStatus(projectId);
        if (result.success && result.data) {
          setProjectStatus(result.data as ProjectStatusResponseModel);
          // 프로젝트 상태를 store에 업데이트
          const projectStatus = result.data.status as ProjectStatusType;
          const tabs = getTabsByStatus(
            projectStatus,
            result.data.is_refunded || false
          );

          setPageStatus(projectStatus);
          setProductionTab(tabs[selectedTab]);
          setIsRefund(result.data.is_refunded || false);
        }
      } catch {
        alert('프로젝트 상태 로드 중 오류');
      }
    };

    loadProjectStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, getProjectStatus, setPageStatus, setProductionTab]);

  // 프로젝트 상태 리로드 함수
  const reloadProjectStatus = useCallback(async () => {
    if (!projectId) return;

    try {
      const result = await getProjectStatus(projectId);
      if (result.success && result.data) {
        setProjectStatus(result.data as ProjectStatusResponseModel);
        // 프로젝트 상태를 store에 업데이트
        const projectStatus = result.data.status as ProjectStatusType;
        const tabs = getTabsByStatus(
          projectStatus,
          result.data.is_refunded || false
        );

        setPageStatus(projectStatus);

        // 프로젝트 상태가 'manufactured'로 변경된 경우 '생산 내역' 탭으로 이동
        if (projectStatus === 'manufactured') {
          const productionHistoryTabIndex = tabs.findIndex(
            (tab) => tab === '생산 내역'
          );
          if (productionHistoryTabIndex !== -1) {
            setSelectedTab(productionHistoryTabIndex);
            setProductionTab(tabs[productionHistoryTabIndex]);
          } else {
            setProductionTab(tabs[selectedTab]);
          }
        } else {
          setProductionTab(tabs[selectedTab]);
        }

        setIsRefund(result.data.is_refunded || false);
      }
    } catch {
      alert('프로젝트 상태 리로드 실패');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectId,
    getProjectStatus,
    setPageStatus,
    setProductionTab,
    selectedTab,
  ]);

  // 프로젝트 상태를 delivery로 변경하는 함수
  const handleChangeStatus = useCallback(
    async (status: ProjectStatusType) => {
      try {
        const result = await updateProjectStatus(projectId, status);
        if (result.success) {
          // store의 pageStatus를 업데이트
          setPageStatus(status);
          // 상태 변경 후 프로젝트 상태 리로드
          await reloadProjectStatus();
        } else {
          alert('프로젝트 상태 변경에 실패했습니다.');
        }
      } catch {
        alert('프로젝트 상태 변경 중 오류가 발생했습니다.');
      }
    },
    [projectId, updateProjectStatus, reloadProjectStatus, setPageStatus]
  );

  // store에 함수 등록
  const setHandleChangeStatus = usePageStatusStore(
    (state) => state.setHandleChangeStatus
  );

  // store에서 모달 상태 가져오기
  const isAddReturnModalOpen = usePageStatusStore(
    (state) => state.isAddReturnModalOpen
  );
  const setAddReturnModalOpen = usePageStatusStore(
    (state) => state.setAddReturnModalOpen
  );

  useEffect(() => {
    setHandleChangeStatus(handleChangeStatus);
    return () => setHandleChangeStatus(null);
  }, [handleChangeStatus, setHandleChangeStatus]);

  const projectStatusType =
    (projectStatus?.status as ProjectStatusType) || 'quotation';
  const tabs = getTabsByStatus(
    projectStatusType,
    projectStatus?.is_refunded || false
  );

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
    <>
      <div className="w-full flex flex-col">
        <ProductFlowTitle
          status={projectStatusType}
          tabs={tabs}
          selectedTab={selectedTab}
          setSelectedTab={(idx) => {
            setSelectedTab(idx);
            setProductionTab(tabs[idx]);
          }}
          // 보여줄 정보
          companyName={quotationData?.factory_name || '-'}
          dueDate={quotationData?.due_date || '-'}
          startDate={projectStatus?.earliest_start_date || ''}
          endDate={projectStatus?.latest_end_date || ''}
        />

        {tabs[selectedTab] === '세금계산서' && (
          <div className="px-10 pt-5 pb-10">
            {projectStatus?.tax_invoice ? (
              <TaxDocumentView taxId={projectStatus?.tax_invoice} />
            ) : (
              <NoHistoryBox
                title="연결된 세금계산서가 없습니다."
                text="세금계산서를 연결해 주세요"
                height="h-[calc(100vh-322.43px)]"
                button="세금계산서 연결"
              />
            )}
          </div>
        )}
        {tabs[selectedTab] === '거래명세서' && quotationData && (
          <div className="px-10 pt-5 pb-10">
            <TransactionDocumentView
              quotationData={quotationData}
              startDate={projectStatus?.earliest_start_date || '-'}
            />
          </div>
        )}
        {tabs[selectedTab] === '납품' && quotationData && (
          <Delivery
            quotationData={quotationData}
            quotationId={projectStatus?.quotation_id || projectId}
            startDate={projectStatus?.earliest_start_date || '-'}
            onProjectStatusChange={reloadProjectStatus}
            projectStatus={projectStatus.status as ProjectStatusType}
          />
        )}
        {tabs[selectedTab] === '생산 현황' && (
          <ProductionMonitor
            projectStatus={projectStatus.status as ProjectStatusType}
          />
        )}
        {tabs[selectedTab] === '생산 내역' && (
          <ProductionLog
            projectStatus={projectStatus.status as ProjectStatusType}
          />
        )}
        {tabs[selectedTab] === '생산 계획' && (
          <ProductionPlan
            handleChangeStatus={handleChangeStatus}
            projectStatus={projectStatus.status as ProjectStatusType}
            onProjectStatusChange={reloadProjectStatus}
          />
        )}
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
                (sum: number, item: QuotationProductDetailResponseModel) =>
                  sum + (item.supply_amount || 0),
                0
              )}
            />
          </div>
        )}
      </div>

      {/* 반품 등록 모달 */}
      {/* 납품, 생산현황 페이지에서 뜸 */}
      {isAddReturnModalOpen && (
        <AddReturnModal
          onClose={() => setAddReturnModalOpen(false)}
          quotationProductData={quotationData?.products || []}
          onProjectStatusChange={handleChangeStatus}
          onTabChange={(tab) => {
            // 탭 인덱스 찾기
            const tabIndex = tabs.findIndex((t) => t === tab);
            if (tabIndex !== -1) {
              setSelectedTab(tabIndex);
              setProductionTab(tabs[tabIndex]);
            }
          }}
        />
      )}
    </>
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
