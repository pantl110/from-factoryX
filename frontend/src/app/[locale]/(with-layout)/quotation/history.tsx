import { useEffect, useState } from 'react';
import { useGetQuotationHistory } from '@/hooks';
import { formatISODate } from '@/utils';
import { QuotationProductHistoryItemResponseModel } from '@/types/data-model';
import HistoryItem from './history-item';
import { useTranslations } from 'next-intl';

interface HistoryProps {
  selectedProduct: number | null;
}

const History = ({ selectedProduct }: HistoryProps) => {
  const t = useTranslations('quotation.history');
  const tCommon = useTranslations('common');
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
        <h4 className="Heading-4 text-dg">{t('empty.title')}</h4>
        <p className="R_Body-1 text-gr whitespace-pre-line text-center">
          {t('empty.description')}
        </p>
      </div>
    );
  }

  if (historyData.length > 0) {
    return (
      <div className="flex flex-col">
        <div className="flex justify-between items-center h-10 mb-3">
          <h3 className="Heading-3">{t('title')}</h3>
        </div>
        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 text-sv rounded-sm">
          <p className="flex-[1.2] py-1 px-3 ">{tCommon('date')}</p>
          <p className="flex-2 py-1 px-3 ">{tCommon('productName')}</p>
          <p className="flex-1 py-1 px-3 ">{tCommon('quantity')}</p>
          <p className="flex-1 py-1 px-3 ">{tCommon('unitPrice')}</p>
          <p className="flex-[1.3] py-1 px-3 ">{tCommon('totalAmount')}</p>
        </div>
        {historyData.map((item, idx) => (
          <HistoryItem
            key={idx}
            date={formatISODate(item.created_at)}
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
        <h4 className="Heading-4 text-dg">{t('empty.title')}</h4>
        <p className="R_Body-1 text-gr whitespace-pre-line">
          {t('empty.description')}
        </p>
      </div>
    );
  }
};

export default History;
