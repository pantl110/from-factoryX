import { useEffect, useState } from 'react';
import ReturnTableHeader from './return-table-header';
import ReturnTableItem from './return-table-item';
import ReturnInfo from './return-info';
import { useGetRefundDetail } from '@/hooks';
import { RefundModel } from '@/types/data-model';
import Spinner from '@/ui/spinner';

interface ReturnSectionProps {
  refundId: number;
}

const ReturnSection = ({ refundId }: ReturnSectionProps) => {
  const [refundData, setRefundData] = useState<RefundModel | null>(null);

  const { getRefundDetail, isLoading, error } = useGetRefundDetail();

  useEffect(() => {
    const fetchRefundData = async () => {
      if (!refundId) return;
      const result = await getRefundDetail({ refund_id: refundId });
      if (result.success && result.data) {
        setRefundData(result.data);
        console.log(result.data);
      }
    };
    fetchRefundData();
  }, [refundId, getRefundDetail]);

  if (isLoading || error || !refundData) {
    return (
      <div className="flex-1 h-100 min-h-0 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full min-h-0 flex flex-col gap-7 overflow-y-auto scrollbar-hide">
      <div className="flex flex-col gap-3">
        <ReturnInfo refundData={refundData} />
        <div>
          <ReturnTableHeader />
          <ReturnTableItem productId={refundData.product.id} />
        </div>
      </div>
    </div>
  );
};

export default ReturnSection;
