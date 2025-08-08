'use client';

import { useEffect, useState } from 'react';
import DeliveryTableItem from './delivery-table-item';
import Pagination from '@/components/pagination';
import useGetUndeliveredProducts from '@/hooks/project/use-get-undelivered-products';
import Spinner from '@/ui/spinner';

interface UndeliveredProductModel {
  company_name: string;
  product_name: string;
  delivery_date: string | null;
  project_id: number;
}

const DeliveryTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [undeliveredProducts, setUndeliveredProducts] = useState<
    UndeliveredProductModel[]
  >([]);
  const [totalPages, setTotalPages] = useState(1);
  const { getUndeliveredProducts, isLoading, error } =
    useGetUndeliveredProducts();

  useEffect(() => {
    const fetchUndeliveredProducts = async () => {
      const result = await getUndeliveredProducts({
        page: currentPage,
      });

      if (result.success && result.data) {
        setUndeliveredProducts(result.data);
        // API에서 페이지 정보를 받아와서 설정 (임시로 1페이지당 5개로 계산)
        setTotalPages(Math.ceil(result.data.length / 5));
      } else {
        console.error('납품되지 않은 견적서 품목 조회 실패:', result.error);
        setUndeliveredProducts([]);
        setTotalPages(1);
      }
    };

    fetchUndeliveredProducts();
  }, [currentPage, getUndeliveredProducts]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-105 justify-between">
        <div className="flex items-center justify-center h-full">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-105 justify-between">
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">에러: {error}</div>
        </div>
      </div>
    );
  }

  if (undeliveredProducts.length === 0) {
    return (
      <div className="flex flex-col h-105 justify-between">
        <div className="flex items-center justify-center h-full">
          <div className="text-gr">납품되지 않은 견적서 품목이 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-105 justify-between">
      <div>
        <div className="flex w-full h-12 items-center Me_Body-1 text-sv border-t border-b border-[#eeeeee]">
          <p className="px-3 w-[150px]">업체명</p>
          <p className="px-3 flex-1">품목명</p>
          <p className="px-3 flex-1">납품일자</p>
          <div className="w-10"></div>
        </div>
        {undeliveredProducts.map((product, index) => (
          <DeliveryTableItem
            key={`${product.project_id}-${index}`}
            projectName={product.company_name}
            productName={product.product_name}
            date={product.delivery_date || ''}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center mt-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default DeliveryTable;
