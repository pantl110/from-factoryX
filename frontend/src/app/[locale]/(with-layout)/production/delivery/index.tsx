'use client';

import { useTranslations } from 'next-intl';
import MiniBtn from '@/ui/mini-btn';
import DeliveryTableHeader from './delivery-table-header';
import DeliveryTableItem from './delivery-table-item';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CreateTransactionOverlayview from './modals/create-transaction-overlayview';
import usePageStatusStore from '@/store/page-status-store';
import MoveToStorageModal from './modals/move-to-storage-modal';
import {
  ProjectQuotationModel,
  ProjectStatusType,
  ProjectQuotationProductsModel,
} from '@/types/data-model';
import DeliveryOverlay from './modals/delevery-overlay';
import {
  useCheckAll,
  useUpdateProjectStatus,
  useUpdateQuotationProductDelivery,
  useGetProjectStatus,
} from '@/hooks';
import Spinner from '@/ui/spinner';
import useSubscriptionStore from '@/store/subscription-store';

interface DeliveryProps {
  // quotationData: ProjectQuotationModel;
  onProjectStatusChange?: () => Promise<void>;
  projectStatus: ProjectStatusType;
  printedAt: string;
}

const Delivery = ({
  // quotationData,
  onProjectStatusChange,
  projectStatus,
  printedAt,
}: DeliveryProps) => {
  const t = useTranslations('production.delivery');
  const params = useParams();
  const projectId = Number(params.id);
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const [isPrintAllDeliveryOverlayOpen, setIsPrintAllDeliveryOverlayOpen] =
    useState(false);
  const [isPrintDeliveryOverlayOpen, setIsPrintDeliveryOverlayOpen] =
    useState(false);
  const [
    isCreateTransactionOverlayviewOpen,
    setIsCreateTransactionOverlayviewOpen,
  ] = useState(false);
  const isMoveToStorageModalOpen = usePageStatusStore(
    (state) => state.isMoveToStorageModalOpen
  );
  const setMoveToStorageModalOpen = usePageStatusStore(
    (state) => state.setMoveToStorageModalOpen
  );
  const setDeliveryDataStore = usePageStatusStore(
    (state) => state.setDeliveryData
  );

  // 로컬 복제본(인쇄/표시에 사용) – 납품일자 변경 시 동기화
  const [localQuotationData, setLocalQuotationData] =
    useState<ProjectQuotationModel | null>(null);

  const [deliveryData, setDeliveryData] = useState<
    ProjectQuotationProductsModel[]
  >([]);

  // 이 탭에서 quotationData를 직접 로드하여 초기화
  const { getProjectStatus, isLoading: isGetProjectStatusLoading } =
    useGetProjectStatus();
  useEffect(() => {
    const loadQuotation = async () => {
      if (!projectId) return;
      try {
        const res = await getProjectStatus(projectId);
        if (res.success && res.data && res.data.quotations?.[0]) {
          const q = res.data.quotations[0] as ProjectQuotationModel;
          setLocalQuotationData(q);
          setDeliveryData(q.products || []);
        }
      } catch {
        // ignore
      }
    };
    loadQuotation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const { updateProjectStatus, isLoading: isUpdateLoading } =
    useUpdateProjectStatus();

  const { updateQuotationProductDelivery } =
    useUpdateQuotationProductDelivery();

  // 체크 기능
  const itemIds =
    deliveryData?.map((item: ProjectQuotationProductsModel) => item.id) || [];
  const { checkedIds, isAllChecked, isChecked, toggleAll, toggleOne } =
    useCheckAll(itemIds);

  // 오버레이 상태
  const [isDeliveryOverlayOpen, setIsDeliveryOverlayOpen] = useState(false);
  const [selectedDeliveryData, setSelectedDeliveryData] =
    useState<ProjectQuotationProductsModel | null>(null);

  // deliveryData를 store에 설정
  useEffect(() => {
    if (deliveryData) {
      setDeliveryDataStore(
        deliveryData.map((item: ProjectQuotationProductsModel) => ({
          delivery_date: item.delivery_date || undefined,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryData]); // setDeliveryDataStore 제거

  // 아이템 클릭 핸들러
  const handleItemClick = (data: ProjectQuotationProductsModel) => {
    setSelectedDeliveryData(data);
    setIsDeliveryOverlayOpen(true);
  };

  // 납품표 출력 버튼 클릭 핸들러
  const handlePrintDelivery = () => {
    setIsPrintDeliveryOverlayOpen(true);
  };

  // 체크된 제품들의 데이터 가져오기
  const getCheckedItemsData = () => {
    if (!deliveryData) return [];

    return checkedIds
      .map((checkedId) => {
        const item = deliveryData.find(
          (item: ProjectQuotationProductsModel) => item.id === checkedId
        );
        if (!item) return null;

        return {
          companyName: localQuotationData?.factory_info.name || '-',
          productName: item.product?.name || '-',
          spec: item.product?.spec || '-',
          unit: item.product?.unit || '-',
          quantity: item.quantity,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };

  // 납품상태 변경 핸들러
  const handleDeliveryStatusChange = async (id: string, newStatus: string) => {
    try {
      // API 호출 후 성공 시 데이터 새로고침
      const productId = Number(id);
      const item = deliveryData.find((item) => item.id === productId);
      const deliveryDate = item?.delivery_date;

      const result = await updateQuotationProductDelivery(productId, {
        is_delivery: newStatus === '완료',
        delivery_date: deliveryDate || undefined,
      });

      if (result.success) {
        setDeliveryData(
          deliveryData.map((item) =>
            item.id === productId
              ? { ...item, is_delivery: newStatus === '완료' }
              : item
          )
        );
      }
    } catch {
      alert(t('errors.statusChangeFailed'));
    }
  };

  // 납품일자 변경 콜백(자식에서 호출) – deliveryData와 localQuotationData 동기화
  const handleDeliveryDateChange = (id: string, newDate: string) => {
    const targetId = Number(id);
    setDeliveryData((prev) =>
      prev.map((item) =>
        item.id === targetId ? { ...item, delivery_date: newDate } : item
      )
    );
    setLocalQuotationData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        products: prev.products.map((p) =>
          p.id === targetId ? { ...p, delivery_date: newDate } : p
        ),
      };
    });
  };

  // 보관함으로 이동하는 버튼
  const handleMoveToStorage = async () => {
    try {
      // 1. 제품들 중 상태가 예정인 것은 완료로 바꾸기
      if (deliveryData) {
        const updatePromises = deliveryData
          .filter((item: ProjectQuotationProductsModel) => !item.is_delivery) // 예정 상태인 항목만 필터링
          .map(async (item: ProjectQuotationProductsModel) => {
            try {
              const result = await updateQuotationProductDelivery(item.id, {
                is_delivery: true,
                delivery_date: item.delivery_date, // 납품일자도 함께 업데이트
              });
              return result.success;
            } catch {
              return false;
            }
          });

        const updateResults = await Promise.all(updatePromises);
        const successCount = updateResults.filter(Boolean).length;
        const totalCount = deliveryData.filter(
          (item: ProjectQuotationProductsModel) => !item.is_delivery
        ).length;

        if (successCount < totalCount) {
          alert(t('errors.partialStatusChangeFailed'));
        }
      }

      // 2. 프로젝트 상태를 completed로 변경
      const result = await updateProjectStatus(projectId, 'completed');
      if (result.success) {
        // 성공 시 부모 컴포넌트에 상태 변경 알림
        if (onProjectStatusChange) {
          await onProjectStatusChange();
        }
      } else {
        // alert('프로젝트 상태 변경에 실패했습니다.');
      }
    } catch {
      // alert('보관함 이동 처리 중 오류가 발생했습니다.');
    } finally {
      onProjectStatusChange?.();
      setMoveToStorageModalOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-col px-10 pt-5 pb-10">
        <div className="flex justify-between pb-4">
          <div className="flex gap-2">
            <MiniBtn
              text={t('printAllButton')}
              variant="whiteOutline"
              onClick={() => setIsPrintAllDeliveryOverlayOpen(true)}
              disabled={!hasSubscription()}
            />
            <MiniBtn
              text={t('printButton')}
              variant="whiteOutline"
              onClick={handlePrintDelivery}
              disabled={checkedIds.length === 0 || !hasSubscription()}
            />
          </div>
          <div className="flex gap-2">
            <MiniBtn
              text={t('transactionStatementPrintButton')}
              variant="whiteOutline"
              onClick={() => setIsCreateTransactionOverlayviewOpen(true)}
              disabled={!hasSubscription()}
            />
          </div>
        </div>
        <div className="flex flex-col w-full overflow-x-auto">
          {isGetProjectStatusLoading ? (
            <div className="flex items-center justify-center w-full h-100">
              <Spinner />
            </div>
          ) : (
            <>
              <DeliveryTableHeader
                isAllChecked={isAllChecked}
                onToggleAll={toggleAll}
              />
              {deliveryData && deliveryData.length > 0 && (
                <>
                  {deliveryData.map((data: ProjectQuotationProductsModel) => (
                    <DeliveryTableItem
                      key={data.id}
                      data={data}
                      isChecked={isChecked(data.id)}
                      onToggle={() => toggleOne(data.id)}
                      onItemClick={handleItemClick}
                      projectStatus={projectStatus}
                      onDeliveryDateChange={handleDeliveryDateChange}
                      onDeliveryStatusChange={handleDeliveryStatusChange}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* 아이템 개별 클릭 시 납품표 출력 오버레이 */}
      {isDeliveryOverlayOpen && selectedDeliveryData && (
        <DeliveryOverlay
          onClose={() => setIsDeliveryOverlayOpen(false)}
          data={[
            {
              companyName: localQuotationData?.client_info.name || '-',
              productName: selectedDeliveryData.product?.name || '-',
              spec: selectedDeliveryData.product?.spec || '-',
              unit: selectedDeliveryData.product?.unit || '-',
              quantity: selectedDeliveryData.quantity,
            },
          ]}
        />
      )}

      {/* 체크된 아이템들의 납품표 출력 오버레이 */}
      {isPrintDeliveryOverlayOpen && checkedIds.length > 0 && (
        <DeliveryOverlay
          onClose={() => setIsPrintDeliveryOverlayOpen(false)}
          data={getCheckedItemsData()}
        />
      )}

      {/* 전체 납품표 일괄 출력 오버레이 */}
      {isPrintAllDeliveryOverlayOpen &&
        deliveryData &&
        deliveryData.length > 0 && (
          <DeliveryOverlay
            onClose={() => setIsPrintAllDeliveryOverlayOpen(false)}
            data={deliveryData.map((item: ProjectQuotationProductsModel) => ({
              companyName: localQuotationData?.client_info.name || '-',
              productName: item.product?.name || '-',
              spec: item.product?.spec || '-',
              unit: item.product?.unit || '-',
              quantity: item.quantity,
            }))}
          />
        )}

      {/* 거래명세서 overlayview */}
      {isCreateTransactionOverlayviewOpen && localQuotationData && (
        <CreateTransactionOverlayview
          onClose={() => setIsCreateTransactionOverlayviewOpen(false)}
          quotationData={localQuotationData}
          printedAt={printedAt}
        />
      )}

      {/* 보관함으로 이동 모달 */}
      {isMoveToStorageModalOpen && (
        <MoveToStorageModal
          onClose={() => setMoveToStorageModalOpen(false)}
          onMoveToStorage={handleMoveToStorage}
          isLoading={isUpdateLoading}
        />
      )}
    </>
  );
};

export default Delivery;
