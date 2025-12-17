import React from 'react';
import TableItem from './table-item';

const Table = () => {
  return (
    <div>
      {/* 표 헤더 */}
      <div className="text-sv flex items-center w-full h-12 border-t border-b border-lg Me_Body-1">
        <p className="flex-[0.8] px-3">채권 상태</p>
        <p className="flex-1 px-3">미수금액(연체금액)</p>
        <p className="flex-1 px-3">받은 금액</p>
        <p className="flex-1 px-3">입금일</p>
        <p className="flex-1 px-3">연체일수</p>
      </div>

      {/* 표 내용 */}
      <TableItem />
      <TableItem />

      {/* 페이지네이션 */}
      {/* <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      /> */}
    </div>
  );
};

export default Table;
