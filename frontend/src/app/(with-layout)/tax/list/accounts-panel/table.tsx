import React from 'react';
import TableItem from './table-item';

interface TableProps {
  isPurchase: boolean;
}

const Table = ({ isPurchase }: TableProps) => {
  const remainHeader = isPurchase ? '미지급금(연체금액)' : '미수금액(연체금액)';
  const paidHeader = isPurchase ? '지급 금액' : '받은 금액';
  const expectedDateHeader = isPurchase ? '지급예정일' : '입금예정일';
  const dateHeader = isPurchase ? '지급일' : '입금일';

  return (
    <div>
      {/* 표 헤더 */}
      <div className="text-sv flex items-center w-full h-12 border-t border-b border-lg Me_Body-1">
        <p className="flex-1 px-3">{expectedDateHeader}</p>
        <p className="flex-1 px-3">{dateHeader}</p>
        <p className="flex-1 px-3">{paidHeader}</p>
        <p className="flex-1 px-3">{remainHeader}</p>
        <p className="flex-1 px-3">연체일</p>
      </div>

      {/* 표 내용 */}
      <TableItem />
      <TableItem />

      {/* 페이지네이션 */}
      {/* <Pagination ... /> */}
    </div>
  );
};

export default Table;
