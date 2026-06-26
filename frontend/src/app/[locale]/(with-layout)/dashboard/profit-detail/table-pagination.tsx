'use client';

import Pagination from '@/components/pagination';

interface TablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const TablePagination = ({
  page,
  totalPages,
  onPageChange,
}: TablePaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }
  return (
    <div className="flex justify-center mt-3">
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default TablePagination;
