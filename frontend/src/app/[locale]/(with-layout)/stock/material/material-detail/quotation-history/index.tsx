import { useTranslations } from 'next-intl';
import { MaterialHistoryResponseModel } from '@/types/data-model';
import QuotationHistoryItem from './quotation-history-item';
import NoHistoryBox from '@/ui/no-history-box';
import Pagination from '@/components/pagination';

interface QuotationHistoryProps {
  setIsClinetDetailPanelOpen: (clientId: number) => void;
  histories?: MaterialHistoryResponseModel[];
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const QuotationHistory = ({
  setIsClinetDetailPanelOpen,
  histories = [],
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: QuotationHistoryProps) => {
  const t = useTranslations('stock.material.quotationHistory');
  const tCommon = useTranslations('common');

  if (isLoading) {
    return <div className="h-50" />;
  }

  if (!histories || histories.length === 0) {
    return (
      <NoHistoryBox title={t('empty.title')} text={t('empty.description')} />
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
        <p className="flex-1 px-3 text-sv">{tCommon('clientName')}</p>
        <p className="flex-1 px-3 text-sv">
          {t('tableHeader.recentTransactionDate')}
        </p>
        <p className="flex-[0.5] px-3 text-sv">{tCommon('quantity')}</p>
        <p className="flex-[0.5] px-3 text-sv">{tCommon('unitPrice')}</p>
        <p className="flex-[0.5] text-sv px-3">{tCommon('totalAmount')}</p>
      </div>
      {histories.map((history) => (
        <QuotationHistoryItem
          key={history.id}
          onClick={
            history.client_id !== null && history.client_id !== undefined
              ? () => setIsClinetDetailPanelOpen(history.client_id as number)
              : () => {}
          }
          data={history}
        />
      ))}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange || (() => {})}
        />
      )}
    </div>
  );
};

export default QuotationHistory;
