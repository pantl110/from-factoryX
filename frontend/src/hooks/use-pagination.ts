import { useState, useMemo } from "react";

interface UsePaginationProps<T> {
  items: T[];
  itemsPerPage: number;
  initialPage?: number;
}

interface UsePaginationReturn<T> {
  currentItems: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  setCurrentPage: (page: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const usePagination = <T>({
  items,
  itemsPerPage,
  initialPage = 1,
}: UsePaginationProps<T>): UsePaginationReturn<T> => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const paginationData = useMemo(() => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);

    return {
      currentItems,
      totalPages,
      totalItems,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [items, currentPage, itemsPerPage]);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(paginationData.totalPages);
  const goToNextPage = () => {
    if (paginationData.hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };
  const goToPrevPage = () => {
    if (paginationData.hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  return {
    currentItems: paginationData.currentItems,
    currentPage,
    totalPages: paginationData.totalPages,
    totalItems: paginationData.totalItems,
    setCurrentPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
    hasNextPage: paginationData.hasNextPage,
    hasPrevPage: paginationData.hasPrevPage,
  };
};

export default usePagination;
