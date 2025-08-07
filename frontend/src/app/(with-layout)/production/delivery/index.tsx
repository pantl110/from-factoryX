import MiniBtn from '@/ui/mini-btn';
import DeliveryTableHeader from './delivery-table-header';
import DeliveryTableItem from './delivery-table-item';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CreateTransactionOverlayview from './modals/create-transaction-overlayview';
import usePageStatusStore from '@/store/page-status-store';
import MoveToStorageModal from './modals/move-to-storage-modal';
import {
  QuotationProductResponseModel,
  ProductResponseModel,
  QuotationResponseModel,
  ProjectStatusType,
} from '@/types/data-model';
import Spinner from '@/ui/spinner';
import DeliveryOverlay from './modals/delevery-overlay';
import {
  useCheckAll,
  useUpdateProjectStatus,
  useGetQuotationProducts,
  useGetProduct,
} from '@/hooks';
import AddReturnModal from './modals/add-return-modal/add-return-modal';

interface DeliveryProps {
  quotationId: number;
  quotationData: QuotationResponseModel;
  startDate: string;
  onProjectStatusChange?: () => Promise<void>;
  projectStatus: ProjectStatusType;
}

const Delivery = ({
  quotationId,
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

  // 로컬스토리지에서 factoryId 가져오기
  const factoryId =
    typeof window !== 'undefined' ? localStorage.getItem('factoryId') : null;
  const parsedFactoryId = factoryId ? parseInt(factoryId, 10) : undefined;

  // 견적서 품목 데이터 가져오기
  const {
    data: deliveryData,
    isLoading,
    error,
  } = useGetQuotationProducts(quotationId, parsedFactoryId);

  // 제품 상세 정보 배열
  const [productDetails, setProductDetails] = useState<
    (ProductResponseModel | null)[]
  >([]);
  const { getProductDetail } = useGetProduct();
  const { updateProjectStatus, isLoading: isUpdateLoading } =
    useUpdateProjectStatus();

  // 체크 기능
  const itemIds = deliveryData?.map((item) => item.id) || [];
  const { checkedIds, isAllChecked, isChecked, toggleAll, toggleOne } =
    useCheckAll(itemIds);

  // 오버레이 상태
  const [isDeliveryOverlayOpen, setIsDeliveryOverlayOpen] = useState(false);
  const [selectedDeliveryData, setSelectedDeliveryData] =
    useState<QuotationProductResponseModel | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] =
    useState<ProductResponseModel | null>(null);

  // 제품 상세 정보 가져오기
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (deliveryData) {
        const details = await Promise.all(
          deliveryData.map(async (item) => {
            if (item.product) {
              const result = await getProductDetail(item.product);
              return result.success ? result.data : null;
            }
            return null;
          })
        );
        setProductDetails(
          details.filter(
            (detail): detail is ProductResponseModel | null =>
              detail !== undefined
          )
        );
      }
    };

    fetchProductDetails();
  }, [deliveryData, getProductDetail]);

  // 아이템 클릭 핸들러
  const handleItemClick = (
    data: QuotationProductResponseModel,
    productDetail: ProductResponseModel | null
  ) => {
    setSelectedDeliveryData(data);
    setSelectedProductDetail(productDetail);
    setIsDeliveryOverlayOpen(true);
  };

  // 납품표 출력 버튼 클릭 핸들러
  const handlePrintDelivery = () => {
    setIsPrintDeliveryOverlayOpen(true);
  };

  // 체크된 품목들의 데이터 가져오기
  const getCheckedItemsData = () => {
    if (!deliveryData || !productDetails) return [];

    return checkedIds
      .map((checkedId) => {
        const itemIndex = deliveryData.findIndex(
          (item) => item.id === checkedId
        );
        if (itemIndex === -1) return null;

        const item = deliveryData[itemIndex];
        const productDetail = productDetails[itemIndex];

        return {
          companyName: quotationData.factory_name,
          productName: productDetail?.name || '-',
          spec: productDetail?.spec || '-',
          unit: productDetail?.unit || '-',
          quantity: item.quantity,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };

  // 보관함으로 이동하는 버튼
  const handleMoveToStorage = async () => {
    try {
      // 1. 품목들 중 상태가 예정인 것은 완료로 바꾸기 (API 아직 없음)
      // TODO: 품목 상태 변경 API 구현 후 추가

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
              text="거래명세서 출력 "
              textColor="text-dg"
              borderColor="border-lg"
              onClick={() => setIsCreateTransactionOverlayviewOpen(true)}
              hoverColor="hover:bg-bg"
            />
            {/* <MiniBtn
              text="세금계산서 생성"
              textColor="text-dg"
              borderColor="border-lg"
              onClick={() => setIsCreateTaxOverlayviewOpen(true)}
              hoverColor="hover:bg-bg"
            /> */}
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
              />
              {deliveryData && deliveryData.length > 0 && (
                <>
                  {deliveryData.map((data, index) => (
                    <DeliveryTableItem
                      key={data.id}
                      data={data}
                      productDetail={productDetails[index]}
                      isChecked={isChecked(data.id)}
                      onToggle={() => toggleOne(data.id)}
                      onItemClick={handleItemClick}
                      projectStatus={projectStatus}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
        {/* <TaxInvoice /> */}
      </div>

      {/* {isCreateTaxOverlayviewOpen && (
        <CreateTaxOverlayview
          onClose={() => setIsCreateTaxOverlayviewOpen(false)}
        />
      )} */}

      {/* 아이템 개별 클릭 시 납품표 출력 오버레이 */}
      {isDeliveryOverlayOpen &&
        selectedDeliveryData &&
        selectedProductDetail && (
          <DeliveryOverlay
            onClose={() => setIsDeliveryOverlayOpen(false)}
            data={[
              {
                companyName: quotationData.factory_name,
                productName: selectedProductDetail.name,
                spec: selectedProductDetail.spec,
                unit: selectedProductDetail.unit,
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
            data={deliveryData.map((item, index) => ({
              companyName: quotationData.factory_name,
              productName: productDetails[index]?.name || '-',
              spec: productDetails[index]?.spec || '-',
              unit: productDetails[index]?.unit || '-',
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
