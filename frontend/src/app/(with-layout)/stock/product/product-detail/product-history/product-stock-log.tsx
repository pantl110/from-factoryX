import { ProductHistoryResponseModel } from '@/types/data-model';
import ProductStockLogItem from './product-stock-log-item';
import Pagination from '@/components/pagination';

interface ProductStockLogProps {
  data: ProductHistoryResponseModel[];
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

const ProductStockLog = ({
  data,
  page,
  totalPages,
  setPage,
}: ProductStockLogProps) => {
  if (data.length === 0) return null;
  return (
    <>
      <div>
        <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
          <p className="w-[150px] py-1 px-3 text-sv">처리일자</p>
          <p className="w-[150px] py-1 px-3 text-sv">상태</p>
          <p className="flex-1 py-1 px-3 text-sv">수량</p>
          <p className="flex-1 py-1 px-3 text-sv">현재 재고</p>
        </div>
        {data.map((item) => (
          <ProductStockLogItem
            key={item.id}
            date={item.created_at}
            status={item.type}
            amount={item.quantity}
            total={item.total_stock}
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
