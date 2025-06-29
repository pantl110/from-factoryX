"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // 페이지 번호 배열 생성 (최대 5개까지 표시)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // 전체 페이지가 5개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지 주변의 5개 페이지 표시
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisiblePages - 1);

      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center py-5 px-6 gap-1 Me_Body-1">
      <div
        className={`flex items-center justify-center w-9 h-9 ${
          currentPage === 1 ? "cursor-default" : "cursor-pointer"
        }`}
        role="button"
        tabIndex={0}
        onClick={handlePrevPage}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handlePrevPage();
        }}
      >
        <CaretLeftIcon
          size={20}
          className={currentPage === 1 ? "text-gr" : "text-sv"}
        />
      </div>
      {getPageNumbers().map((page) => (
        <div
          key={page}
          className={`flex items-center justify-center w-9 h-9 cursor-pointer rounded-lg ${
            currentPage === page ? "bg-primary text-wh" : ""
          }`}
          role="button"
          tabIndex={0}
          onClick={() => onPageChange(page)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onPageChange(page);
          }}
        >
          {page}
        </div>
      ))}
      <div
        className={`flex items-center justify-center w-9 h-9 ${
          currentPage === totalPages ? "cursor-default" : "cursor-pointer"
        }`}
        role="button"
        tabIndex={0}
        onClick={handleNextPage}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleNextPage();
        }}
      >
        <CaretRightIcon
          size={20}
          className={currentPage === totalPages ? "text-gr" : "text-sv"}
        />
      </div>
    </div>
  );
};

export default Pagination;
