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
  if (isLoading || !histories || histories.length === 0) {
    return (
      <NoHistoryBox
        title="이 원자재의 거래 내역이 아직 없어요."
        text="거래 내역이 쌓이면 이곳에서 업체별 단가를 비교할 수 있어요."
      />
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1">
        <p className="flex-1 px-3 text-sv">업체명</p>
        <p className="flex-1 px-3 text-sv">거래일자</p>
        <p className="flex-[0.5] px-3 text-sv">수량</p>
        <p className="flex-[0.5] px-3 text-sv">단가</p>
        <p className="flex-[0.5] text-sv px-3">금액</p>
      </div>
      {histories.map((history) => (
        <QuotationHistoryItem
          key={history.id}
          onClick={() => setIsClinetDetailPanelOpen(history.client_id)}
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
