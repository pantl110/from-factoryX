import MiniBtn from '@/ui/mini-btn';
import DeliveryTableHeader from './delivery-table-header';
import DeliveryTableItem from './delivery-table-item';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CreateTransactionOverlayview from './modals/create-transaction-overlayview';
import usePageStatusStore from '@/store/page-status-store';
import MoveToStorageModal from './modals/move-to-storage-modal';
import useMemberStore from '@/store/member-store';
import {
  ProjectQuotationModel,
  ProjectStatusType,
  ProjectPlanModel,
} from '@/types/data-model';
import Spinner from '@/ui/spinner';
import DeliveryOverlay from './modals/delevery-overlay';
import {
  useCheckAll,
  useUpdateProjectStatus,
  useGetProjectPlans,
  useUpdateQuotationProductDelivery,
} from '@/hooks';

interface DeliveryProps {
  quotationData: ProjectQuotationModel;
  startDate: string;
  onProjectStatusChange?: () => Promise<void>;
  projectStatus: ProjectStatusType;
}

const Delivery = ({
  quotationData,
  startDate,
  onProjectStatusChange,
  projectStatus,
}: DeliveryProps) => {
  const params = useParams();
  const projectId = Number(params.id);

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

  // Zustand store에서 factoryId 가져오기
  const factoryId = useMemberStore((state) => state.factoryId);

  // 프로젝트 플랜에서 납품 정보 가져오기
  const { getProjectPlans, isLoading, error } = useGetProjectPlans();
  const [deliveryData, setDeliveryData] = useState<ProjectPlanModel[]>([]);

  const { updateProjectStatus, isLoading: isUpdateLoading } =
    useUpdateProjectStatus();

  const { updateQuotationProductDelivery } =
    useUpdateQuotationProductDelivery();

  // 프로젝트 플랜 데이터 로드
  useEffect(() => {
    const loadProjectPlans = async () => {
      if (factoryId && projectId) {
        try {
          const result = await getProjectPlans(projectId);
          if (result.success && result.data) {
            setDeliveryData(result.data);
          }
        } catch {
          // Error handling can be added here if needed
        }
      }
    };

    loadProjectPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId, projectId]); // getProjectPlans 제거

  // 체크 기능
  const itemIds = deliveryData?.map((item: ProjectPlanModel) => item.id) || [];
  const { checkedIds, isAllChecked, isChecked, toggleAll, toggleOne } =
    useCheckAll(itemIds);

  // 오버레이 상태
  const [isDeliveryOverlayOpen, setIsDeliveryOverlayOpen] = useState(false);
  const [selectedDeliveryData, setSelectedDeliveryData] =
    useState<ProjectPlanModel | null>(null);

  // deliveryData를 store에 설정
  useEffect(() => {
    if (deliveryData) {
      setDeliveryDataStore(
        deliveryData.map((item: ProjectPlanModel) => ({
          delivery_date: item.quotation_product?.delivery_date || undefined,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryData]); // setDeliveryDataStore 제거

  // 아이템 클릭 핸들러
  const handleItemClick = (data: ProjectPlanModel) => {
    setSelectedDeliveryData(data);
    setIsDeliveryOverlayOpen(true);
  };

  // 납품표 출력 버튼 클릭 핸들러
  const handlePrintDelivery = () => {
    setIsPrintDeliveryOverlayOpen(true);
  };

  // 체크된 품목들의 데이터 가져오기
  const getCheckedItemsData = () => {
    if (!deliveryData) return [];

    return checkedIds
      .map((checkedId) => {
        const item = deliveryData.find(
          (item: ProjectPlanModel) => item.id === checkedId
        );
        if (!item) return null;

        return {
          companyName: quotationData.factory_name,
          productName: item.quotation_product?.product?.name || '-',
          spec: item.quotation_product?.product?.spec || '-',
          unit: item.quotation_product?.product?.unit || '-',
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
      const deliveryDate = item?.quotation_product?.delivery_date;

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
      alert('납품상태 변경에 실패했습니다.');
    }
  };

  // 보관함으로 이동하는 버튼
  const handleMoveToStorage = async () => {
    try {
      // 1. 품목들 중 상태가 예정인 것은 완료로 바꾸기
      if (deliveryData) {
        const updatePromises = deliveryData
          .filter(
            (item: ProjectPlanModel) => !item.quotation_product?.is_delivery
          ) // 예정 상태인 항목만 필터링
          .map(async (item: ProjectPlanModel) => {
            try {
              const result = await updateQuotationProductDelivery(
                item.quotation_product.id,
                {
                  is_delivery: true,
                  delivery_date: item.quotation_product.delivery_date, // 납품일자도 함께 업데이트
                }
              );
              return result.success;
            } catch {
              return false;
            }
          });

        const updateResults = await Promise.all(updatePromises);
        const successCount = updateResults.filter(Boolean).length;
        const totalCount = deliveryData.filter(
          (item: ProjectPlanModel) => !item.quotation_product?.is_delivery
        ).length;

        if (successCount < totalCount) {
          alert(`일부 품목 상태 변경에 실패했습니다.`);
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
        alert('프로젝트 상태 변경에 실패했습니다.');
      }
    } catch {
      alert('보관함 이동 처리 중 오류가 발생했습니다.');
    } finally {
      setMoveToStorageModalOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-col px-10 pt-5 pb-10">
        <div className="flex justify-between pb-4">
          <div className="flex gap-2">
            <MiniBtn
              text="납품표 일괄 출력"
              textColor="text-dg"
              borderColor="border-lg"
              onClick={() => setIsPrintAllDeliveryOverlayOpen(true)}
              hoverColor="hover:bg-bg"
            />
            <MiniBtn
              text="납품표 출력"
              textColor="text-dg"
              borderColor="border-lg"
              onClick={handlePrintDelivery}
              hoverColor="hover:bg-bg"
              disabled={checkedIds.length === 0}
            />
          </div>
          <div className="flex gap-2">
            <MiniBtn
              text="거래명세서 출력"
              textColor="text-dg"
              borderColor="border-lg"
              onClick={() => setIsCreateTransactionOverlayviewOpen(true)}
              hoverColor="hover:bg-bg"
            />
          </div>
        </div>
        <div className="flex flex-col w-full overflow-x-auto">
          {isLoading || error ? (
            <div className="flex items-center justify-center w-full h-100">
              <Spinner />
            </div>
          ) : (
            <>
              <DeliveryTableHeader
                isAllChecked={isAllChecked}
                onToggleAll={toggleAll}
                projectStatus={projectStatus}
              />
              {deliveryData && deliveryData.length > 0 && (
                <>
                  {deliveryData.map((data: ProjectPlanModel) => (
                    <DeliveryTableItem
                      key={data.id}
                      data={data}
                      isChecked={isChecked(data.id)}
                      onToggle={() => toggleOne(data.id)}
                      onItemClick={handleItemClick}
                      projectStatus={projectStatus}
                      onDeliveryDateChange={() => {}}
                      onDeliveryStatusChange={handleDeliveryStatusChange}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
        {/* <TaxInvoice /> */}
      </div>

      {/* 아이템 개별 클릭 시 납품표 출력 오버레이 */}
      {isDeliveryOverlayOpen && selectedDeliveryData && (
        <DeliveryOverlay
          onClose={() => setIsDeliveryOverlayOpen(false)}
          data={[
            {
              companyName: quotationData.client_info.name,
              productName:
                selectedDeliveryData.quotation_product?.product?.name || '-',
              spec:
                selectedDeliveryData.quotation_product?.product?.spec || '-',
              unit:
                selectedDeliveryData.quotation_product?.product?.unit || '-',
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
            data={deliveryData.map((item: ProjectPlanModel) => ({
              companyName: quotationData.client_info.name,
              productName: item.quotation_product?.product?.name || '-',
              spec: item.quotation_product?.product?.spec || '-',
              unit: item.quotation_product?.product?.unit || '-',
              quantity: item.quantity,
            }))}
          />
        )}

      {/* 거래명세서 overlayview */}
      {isCreateTransactionOverlayviewOpen && quotationData && (
        <CreateTransactionOverlayview
          onClose={() => setIsCreateTransactionOverlayviewOpen(false)}
          quotationData={quotationData}
          startDate={startDate}
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
