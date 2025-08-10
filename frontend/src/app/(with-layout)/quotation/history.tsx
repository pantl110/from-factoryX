import { useEffect, useState } from 'react';
import { useGetQuotationHistory } from '@/hooks';
import { QuotationProductHistoryItemResponseModel } from '@/types/data-model';
import HistoryItem from './history-item';

interface HistoryProps {
  selectedProduct: number | null;
}

const History = ({ selectedProduct }: HistoryProps) => {
  const [historyData, setHistoryData] = useState<
    QuotationProductHistoryItemResponseModel[]
  >([]);

  const { getHistory } = useGetQuotationHistory();

  // selectedProduct가 변경될 때마다 히스토리 데이터 가져오기
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedProduct) {
        setHistoryData([]);
        return;
      }

      try {
        const result = await getHistory([selectedProduct]);
        setHistoryData(result.results || []);
      } catch {
        setHistoryData([]);
      }
    };

    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  // selectedProduct가 없으면 빈 상태 표시
  if (!selectedProduct) {
    return (
      <div className="py-8 h-full flex flex-col justify-center items-center gap-2 rounded-[4px] border border-[#E4E4E7]">
        <h4 className="Heading-4 text-dg">히스토리가 아직 없어요.</h4>
        <p className="R_Body-1 text-gr">
          처음 등록된 품목이라, 과거 단가나 수량 기록이 아직 없어요.
        </p>
      </div>
    );
  }

  if (historyData.length > 0) {
    return (
      <div className="flex flex-col">
        <div className="flex justify-between items-center h-10 mb-3">
          <h3 className="Heading-3">요청 히스토리</h3>
        </div>
        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
          <p className="flex-[1.2] py-1 px-3 ">날짜</p>
          <p className="flex-2 py-1 px-3 ">품목정보</p>
          <p className="flex-1 py-1 px-3 ">수량</p>
          <p className="flex-1 py-1 px-3 ">단가</p>
          <p className="flex-[1.3] py-1 px-3 ">금액</p>
        </div>
        {historyData.map((item, idx) => (
          <HistoryItem
            key={idx}
            productName={item.product_name}
            quantity={item.quantity}
            unitPrice={item.unit_price}
            totalPrice={item.total_amount}
          />
        ))}
      </div>
    );
  } else {
    // 히스토리 데이터 없을 때
    return (
      <div className="py-8 h-full flex flex-col justify-center items-center gap-2 rounded-[4px] border border-[#E4E4E7]">
        <h4 className="Heading-4 text-dg">히스토리가 아직 없어요.</h4>
        <p className="R_Body-1 text-gr">
          처음 등록된 품목이라, 과거 단가나 수량 기록이 아직 없어요.
        </p>
      </div>
    );
  }
};

export default History;
