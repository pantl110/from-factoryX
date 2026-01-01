'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import usePageStatusStore from '@/store/page-status-store';
import { useGetProjectStatus, useUpdateProjectStatus } from '@/hooks';
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
import AddReturnModal from '../delivery/modals/add-return-modal/add-return-modal';
import {
  ProjectQuotationProductsInfoModel,
  ProjectStatusResponseModel,
} from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import LinkTaxModal from '../../project/process/modals/link-tax-modal/link-tax-modal';
import TaxDetailPanel from '@/app/[locale]/(with-layout)/tax/tax-detail-panel';
import getLastDeliveryDate from '@/utils/get-last-delivery-date';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

const getTabsByStatus = (
  status: ProjectStatusType,
  isRefund: boolean,
  t: (key: string) => string
): ProductionTabType[] => {
  if (status === 'pending')
    return [
      t('tabs.productionPlan') as ProductionTabType,
      t('tabs.orderDocument') as ProductionTabType,
    ];
  if (status === 'production')
    return isRefund
      ? [
          t('tabs.delivery') as ProductionTabType,
          t('tabs.productionStatus') as ProductionTabType,
          t('tabs.productionPlan') as ProductionTabType,
          t('tabs.orderDocument') as ProductionTabType,
        ]
      : [
          t('tabs.productionStatus') as ProductionTabType,
          t('tabs.productionPlan') as ProductionTabType,
          t('tabs.orderDocument') as ProductionTabType,
        ];
  if (status === 'manufactured')
    return isRefund
      ? [
          t('tabs.delivery') as ProductionTabType,
          t('tabs.productionStatus') as ProductionTabType,
          t('tabs.productionHistory') as ProductionTabType,
          t('tabs.orderDocument') as ProductionTabType,
        ]
      : [
          t('tabs.productionStatus') as ProductionTabType,
          t('tabs.productionHistory') as ProductionTabType,
          t('tabs.orderDocument') as ProductionTabType,
        ];
  if (status === 'delivery')
    return [
      t('tabs.delivery') as ProductionTabType,
      t('tabs.productionStatus') as ProductionTabType,
      t('tabs.productionHistory') as ProductionTabType,
      t('tabs.orderDocument') as ProductionTabType,
    ];
  if (status === 'completed')
    return [
      t('tabs.taxInvoice') as ProductionTabType,
      t('tabs.transactionStatement') as ProductionTabType,
      t('tabs.delivery') as ProductionTabType,
      t('tabs.productionStatus') as ProductionTabType,
      t('tabs.productionHistory') as ProductionTabType,
      t('tabs.orderDocument') as ProductionTabType,
    ];
  return [
    t('tabs.productionPlan') as ProductionTabType,
    t('tabs.orderDocument') as ProductionTabType,
  ];
};

const ProductionPageContent = () => {
  const params = useParams();
  const projectId = Number(params.id);
  const tProduction = useTranslations('production');
  const t = useTranslations('production');
  const tCommon = useTranslations('common');
  const { getProjectStatus, isLoading } = useGetProjectStatus();
  const { updateProjectStatus } = useUpdateProjectStatus();
  const setPageStatus = usePageStatusStore((state) => state.setPageStatus);
  const [selectedTab, setSelectedTab] = useState(0);
  const setProductionTab = usePageStatusStore(
    (state) => state.setProductionTab
  );
  const setProjectStatusData = usePageStatusStore(
    (state) => state.setProjectStatusData
  );

  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const isPartnersSubscription = useSubscriptionStore(
    (state) => state.isPartnersSubscription
  );

  const [isLinkTaxInvoiceModalOpen, setIsLinkTaxInvoiceModalOpen] =
    useState(false);
  const [isTaxPanelOpen, setIsTaxPanelOpen] = useState(false);

  // 프로젝트 상태 데이터
  const [projectStatus, setProjectStatus] =
    useState<ProjectStatusResponseModel | null>(null);

  // 프로젝트 상태 로드 및 store 업데이트
  useEffect(() => {
    if (!projectId) return;

    const loadProjectStatus = async () => {
      try {
        const result = await getProjectStatus(projectId);
        if (result.success && result.data) {
          setProjectStatus(result.data as ProjectStatusResponseModel);
          setProjectStatusData(result.data as ProjectStatusResponseModel);
          // 프로젝트 상태를 store에 업데이트
          const projectStatus = result.data.status as ProjectStatusType;
          const tabs = getTabsByStatus(
            projectStatus,
            result.data.is_refunded || false,
            t
          );

          setPageStatus(projectStatus);
          setProductionTab(tabs[selectedTab]);
        }
      } catch {
        alert(tProduction('loadError'));
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
        setProjectStatusData(result.data as ProjectStatusResponseModel);
        // 프로젝트 상태를 store에 업데이트
        const projectStatus = result.data.status as ProjectStatusType;
        const tabs = getTabsByStatus(
          projectStatus,
          result.data.is_refunded || false,
          t
        );

        setPageStatus(projectStatus);

        // 특정 상태 변경에만 탭 자동 변경 (불필요한 탭 변경 방지)
        if (projectStatus === 'manufactured') {
          // 생산 완료 → 생산 내역 탭으로 이동
          const productionHistoryTabIndex = tabs.findIndex(
            (tab) => tab === t('tabs.productionHistory')
          );
          if (productionHistoryTabIndex !== -1) {
            setSelectedTab(productionHistoryTabIndex);
            setProductionTab(tabs[productionHistoryTabIndex]);
          }
        } else if (projectStatus === 'delivery') {
          // 납품 → 납품 탭으로 이동
          const deliveryTabIndex = tabs.findIndex(
            (tab) => tab === t('tabs.delivery')
          );
          if (deliveryTabIndex !== -1) {
            setSelectedTab(deliveryTabIndex);
            setProductionTab(tabs[deliveryTabIndex]);
          }
        } else if (projectStatus === 'completed') {
          // 완료 상태에서는 현재 탭이 세금계산서 탭이면 유지, 아니면 납품 탭으로 이동
          const taxTabIndex = tabs.findIndex(
            (tab) => tab === t('tabs.taxInvoice')
          );
          const currentTabName = tabs[selectedTab];

          if (currentTabName === t('tabs.taxInvoice') && taxTabIndex !== -1) {
            // 현재 세금계산서 탭에 있으면 유지
            setProductionTab(tabs[selectedTab]);
          } else {
            // 그 외의 경우 납품 탭으로 이동
            const deliveryTabIndex = tabs.findIndex(
              (tab) => tab === t('tabs.delivery')
            );
            if (deliveryTabIndex !== -1) {
              setSelectedTab(deliveryTabIndex);
              setProductionTab(tabs[deliveryTabIndex]);
            }
          }
        }
        // pending → production, production → manufactured 등은 탭 변경하지 않음
      }
    } catch {
      alert(tProduction('reloadError'));
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
          reloadProjectStatus();
          // alert('프로젝트 상태 변경에 실패했습니다.');
        }
      } catch {
        reloadProjectStatus();
        // alert('프로젝트 상태 변경 중 오류가 발생했습니다.');
      }
    },
    [projectId, updateProjectStatus, reloadProjectStatus, setPageStatus]
  );

  // store에 함수 등록
  const setHandleChangeStatus = usePageStatusStore(
    (state) => state.setHandleChangeStatus
  );
  const setReloadProjectStatus = usePageStatusStore(
    (state) => state.setReloadProjectStatus
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
    setReloadProjectStatus(reloadProjectStatus);
    return () => {
      setHandleChangeStatus(null);
      setReloadProjectStatus(null);
    };
  }, [
    handleChangeStatus,
    setHandleChangeStatus,
    reloadProjectStatus,
    setReloadProjectStatus,
  ]);

  const projectStatusType =
    (projectStatus?.status as ProjectStatusType) || 'quotation';
  const tabs = getTabsByStatus(
    projectStatusType,
    projectStatus?.is_refunded || false,
    t
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
          companyName={projectStatus?.quotations[0].client_info.name || '-'}
          dueDate={projectStatus?.quotations[0].due_date || '-'}
          startDate={projectStatus?.earliest_start_date || ''}
          endDate={projectStatus?.latest_end_date || ''}
        />

        {tabs[selectedTab] === t('tabs.taxInvoice') && (
          <div className="px-10 pt-5 pb-10">
            {projectStatus?.tax_invoice ? (
              <TaxDocumentView taxId={projectStatus?.tax_invoice.id || 0} />
            ) : (
              <>
                <NoHistoryBox
                  title={tProduction('noTaxInvoice')}
                  text={tProduction('linkTaxInvoice')}
                  height="h-[calc(100vh-322.43px)]"
                  button={tProduction('linkTaxInvoiceButton')}
                  onClick={() => {
                    setIsLinkTaxInvoiceModalOpen(true);
                  }}
                  disabled={
                    isViewer ||
                    role === 'prod_manager' ||
                    !isPartnersSubscription()
                  }
                />
                {isLinkTaxInvoiceModalOpen && (
                  <LinkTaxModal
                    onClose={() => setIsLinkTaxInvoiceModalOpen(false)}
                    type="project"
                    linkedItemId={projectId}
                    canCreate={true}
                    onSuccess={() => {
                      reloadProjectStatus();
                    }}
                    projectStatus={projectStatus}
                    setIsTaxPanelOpen={setIsTaxPanelOpen}
                  />
                )}
                {isTaxPanelOpen && (
                  <TaxDetailPanel
                    onClose={() => setIsTaxPanelOpen(false)}
                    projectId={projectId}
                    initialClientData={projectStatus?.quotations[0].client_info}
                    initialProducts={projectStatus?.quotations[0].products_info.map(
                      (p) => ({
                        productId: p.id,
                        quantity: p.quantity,
                        unit_price: p.unit_price,
                        product_name: p.name,
                        product_code: p.code,
                        product_spec: p.spec,
                      })
                    )}
                    onTaxCreated={async (_taxId) => {
                      // 세금계산서 생성 후 프로젝트 상태 리로드하여 버튼 업데이트
                      await reloadProjectStatus();
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}
        {tabs[selectedTab] === t('tabs.transactionStatement') &&
          projectStatus?.quotations[0] && (
            <div className="px-10 pt-5 pb-10">
              <TransactionDocumentView
                quotationData={projectStatus?.quotations[0]}
                lastDeliveryDate={getLastDeliveryDate(
                  projectStatus?.quotations[0]
                )}
              />
            </div>
          )}
        {tabs[selectedTab] === t('tabs.delivery') &&
          projectStatus?.quotations[0] && (
            <Delivery
              // quotationData={projectStatus?.quotations[0]}
              onProjectStatusChange={reloadProjectStatus}
              projectStatus={projectStatus.status as ProjectStatusType}
              printedAt={projectStatus.printed_at}
            />
          )}
        {tabs[selectedTab] === t('tabs.productionStatus') && (
          <ProductionMonitor
            projectStatus={projectStatus.status as ProjectStatusType}
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
        {tabs[selectedTab] === t('tabs.productionHistory') && (
          <ProductionLog
            projectStatus={projectStatus.status as ProjectStatusType}
          />
        )}
        {tabs[selectedTab] === t('tabs.productionPlan') && (
          <ProductionPlan
            handleChangeStatus={handleChangeStatus}
            projectStatus={projectStatus.status as ProjectStatusType}
          />
        )}
        {tabs[selectedTab] === t('tabs.orderDocument') &&
          projectStatus?.quotations[0] && (
            <div className="px-10 pt-5 pb-10">
              <OrderDocumentView
                documentTitle={t('tabs.orderDocument')}
                clientData={projectStatus?.quotations[0].client_info}
                dueDate={projectStatus?.quotations[0].due_date || '-'}
                productListInfoTitle={tCommon('orderProductInfo')}
                productItems={projectStatus?.quotations[0].products_info.map(
                  (p) => ({
                    productId: p.id,
                    product_code: p.code,
                    product_name: p.name,
                    spec: p.spec,
                    unit: p.unit,
                    quantity: p.quantity,
                    unit_price: p.unit_price,
                  })
                )}
                supplyAmount={(() => {
                  // 국세청 공식: 합계금액에서 공급가액 계산
                  const totalAmount =
                    projectStatus?.quotations[0].products_info.reduce(
                      (sum: number, item: ProjectQuotationProductsInfoModel) =>
                        sum + (item.unit_price * item.quantity || 0),
                      0
                    ) || 0;
                  // 국세청 공식: 공급가액 = 합계금액 ÷ 1.1
                  return Math.floor(totalAmount / 1.1);
                })()}
                taxAmount={(() => {
                  // 국세청 공식: 합계금액에서 공급가액과 세액 계산
                  const totalAmount =
                    projectStatus?.quotations[0].products_info.reduce(
                      (sum: number, item: ProjectQuotationProductsInfoModel) =>
                        sum + (item.unit_price * item.quantity || 0),
                      0
                    ) || 0;
                  // 국세청 공식: 공급가액 = 합계금액 ÷ 1.1, 세액 = 합계금액 - 공급가액
                  const calculatedSupplyAmount = Math.floor(totalAmount / 1.1);
                  return totalAmount - calculatedSupplyAmount;
                })()}
              />
            </div>
          )}
      </div>

      {/* 반품 등록 모달 */}
      {/* 납품, 생산현황 페이지에서 뜸 */}
      {isAddReturnModalOpen && (
        <AddReturnModal
          onClose={() => setAddReturnModalOpen(false)}
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
