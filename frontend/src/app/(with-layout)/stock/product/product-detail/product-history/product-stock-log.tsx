import { ProductHistoryResponseModel } from '@/types/data-model';
import ProductStockLogItem from './product-stock-log-item';
import Pagination from '@/components/pagination';

interface ProductStockLogProps {
  data: ProductHistoryResponseModel[];
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  setIsProjectStockHistoryModalOpen: (modal: {
    isOpen: boolean;
    projectId?: number;
  }) => void;
}

const ProductStockLog = ({
  data,
  page,
  totalPages,
  setPage,
  setIsProjectStockHistoryModalOpen,
}: ProductStockLogProps) => {
  if (data.length === 0) return null;
  return (
    <>
      <div>
        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1">
          <p className="flex-1 py-1 px-3 text-sv">처리일자</p>
          <p className="flex-1 py-1 px-3 text-sv">업체명</p>
          <p className="flex-1 py-1 px-3 text-sv">생산 수량</p>
          <p className="flex-1 py-1 px-3 text-sv">납품 수량</p>
          <p className="flex-1 py-1 px-3 text-sv">현재 재고</p>
          <p className="flex-1 py-1 px-3 text-sv">변동 로그</p>
        </div>
        {data.map((item) => (
          <ProductStockLogItem
            key={item.id}
            item={item}
            setIsProjectStockHistoryModalOpen={
              setIsProjectStockHistoryModalOpen
            }
          />
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
};

export default ProductStockLog;
