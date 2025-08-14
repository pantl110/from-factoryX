'use client';

import DeliveryTableItem from './delivery-table-item';
import Pagination from '@/components/pagination';
import NoHistoryBox from '@/ui/no-history-box';
import { usePagination } from '@/hooks';
import { useRouter } from 'next/navigation';

interface UndeliveredProductModel {
  company_name: string;
  product_name: string;
  delivery_date: string | null;
  project_id: number;
}

interface DeliveryTableProps {
  undeliveredProducts: UndeliveredProductModel[];
  isLoading: boolean;
}

const DeliveryTable = ({
  undeliveredProducts,
  isLoading,
}: DeliveryTableProps) => {
  const router = useRouter();

  // usePagination 훅 사용
  const { currentItems, currentPage, totalPages, setCurrentPage } =
    usePagination({
      items: undeliveredProducts,
      itemsPerPage: 5,
    });

  if (isLoading || undeliveredProducts.length === 0) {
    return (
      <NoHistoryBox
        title="납품 일정이 없어요."
        text="가장 가까운 납품 일정부터 순서대로 보여져요."
      />
    );
  }

  return (
    <div className="flex flex-col justify-between">
      <div>
        <div className="flex w-full h-12 items-center Me_Body-1 text-sv border-t border-b border-[#eeeeee]">
          <p className="px-3 w-[150px]">업체명</p>
          <p className="px-3 flex-1">품목명</p>
          <p className="px-3 flex-1">납품일자</p>
          <div className="w-10"></div>
        </div>
        {currentItems.map((product, index) => (
          <DeliveryTableItem
            key={`${product.project_id}-${index}`}
            projectName={product.company_name}
            productName={product.product_name}
            date={product.delivery_date || '-'}
            onClick={() => {
              router.push(`/production/${product.project_id}`);
            }}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default DeliveryTable;
