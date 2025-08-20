import { useEffect, useState } from 'react';
import Spinner from '@/ui/spinner';
import { useGetRefundDetail, useGetProduct } from '@/hooks';
import { RefundModel, ProductResponseModel } from '@/types/data-model';
import ReturnInfo from './return-info';
import ReturnTableHeader from './return-table-header';
import ReturnTableItem from './return-table-item';

interface ReturnSectionProps {
  refundId: number;
  logId: number;
}

const ReturnSection = ({ refundId, logId }: ReturnSectionProps) => {
  const [refundData, setRefundData] = useState<RefundModel | null>(null);
  const [productDetail, setProductDetail] =
    useState<ProductResponseModel | null>(null);

  // 실시간 입력값을 추적하기 위한 상태 추가
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [currentProductionAmount, setCurrentProductionAmount] =
    useState<number>(0);

  const {
    getRefundDetail,
    isLoading: isRefundLoading,
    error: isRefundError,
  } = useGetRefundDetail();
  const {
    getProductDetail,
    isLoading: isProductLoading,
    error: isProductError,
  } = useGetProduct();

  useEffect(() => {
    const fetchRefundData = async () => {
      if (!refundId) return;
      const result = await getRefundDetail({ refund_id: refundId });
      if (result.success && result.data) {
        setRefundData(result.data);
        // 초기값 설정 - refundData에서 가져옴
        setCurrentAmount(result.data.amount);
        setCurrentProductionAmount(
          result.data.amount - (result.data.current_stock || 0)
        );
      }
    };
    fetchRefundData();
  }, [refundId, getRefundDetail]);

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!refundData?.product.id) return;
      const result = await getProductDetail(refundData.product.id);
      if (result.success && result.data) {
        setProductDetail(result.data);
      }
    };

    fetchProductDetail();
  }, [refundData?.product.id, getProductDetail, refundData]);

  // 입력값 변경 핸들러
  const handleAmountChange = (newAmount: number) => {
    setCurrentAmount(newAmount);
  };
  const handleProductionAmountChange = (newProductionAmount: number) => {
    setCurrentProductionAmount(newProductionAmount);
  };

  if (
    isRefundLoading ||
    isProductLoading ||
    isRefundError ||
    isProductError ||
    !refundData ||
    !productDetail
  ) {
    return (
      <div className="flex-1 h-100 min-h-0 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // 실시간 입력값을 사용하여 표 표시 여부 결정
  const shouldShowTable =
    currentAmount === currentProductionAmount + (refundData.current_stock || 0);

  return (
    <div className="flex-1 h-full min-h-0 flex flex-col gap-7 overflow-y-auto scrollbar-hide">
      <div className="flex flex-col gap-3">
        <ReturnInfo
          refundData={refundData}
          onAmountChange={handleAmountChange}
          onProductionAmountChange={handleProductionAmountChange}
          logId={logId}
        />
        {shouldShowTable && (
          <div>
            <ReturnTableHeader />
            <ReturnTableItem productDetail={productDetail} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnSection;
