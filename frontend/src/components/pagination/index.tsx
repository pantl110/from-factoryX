"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useState } from "react";

const Pagination = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-center py-5 px-6 gap-1 Me_Body-1">
      <div
        className={`flex items-center justify-center w-9 h-9 cursor-pointer`}
        onClick={handlePrevPage}
      >
        <CaretLeftIcon
          size={20}
          className={currentPage === 1 ? "text-gr" : "text-sv"}
        />
      </div>
      {[1, 2, 3, 4, 5].map((page) => (
        <div
          key={page}
          className={`flex items-center justify-center w-9 h-9 cursor-pointer rounded-lg ${
            currentPage === page ? "bg-primary text-wh" : ""
          }`}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </div>
      ))}
      <div
        className={`flex items-center justify-center w-9 h-9 cursor-pointer`}
        onClick={handleNextPage}
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
