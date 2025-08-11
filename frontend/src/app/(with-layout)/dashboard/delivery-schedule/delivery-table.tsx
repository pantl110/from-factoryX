'use client';

import { useState } from 'react';
import DeliveryTableItem from './delivery-table-item';
import Pagination from '@/components/pagination';
import Spinner from '@/ui/spinner';

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
  const [currentPage, setCurrentPage] = useState(1);

  // 페이지네이션 계산
  const itemsPerPage = 5;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = undeliveredProducts.slice(startIndex, endIndex);
  const calculatedTotalPages = Math.ceil(
    undeliveredProducts.length / itemsPerPage
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-105 justify-between">
        <div className="flex items-center justify-center h-full">
          <Spinner />
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
        {currentItems.map((product, index) => (
          <DeliveryTableItem
            key={`${product.project_id}-${index}`}
            projectName={product.company_name}
            productName={product.product_name}
            date={product.delivery_date || ''}
          />
        ))}
      </div>
      {calculatedTotalPages > 1 && (
        <div className="flex justify-center mt-3">
          <Pagination
            currentPage={currentPage}
            totalPages={calculatedTotalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default DeliveryTable;
