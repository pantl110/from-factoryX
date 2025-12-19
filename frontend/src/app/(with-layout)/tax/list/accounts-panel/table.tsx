'use client';

import React, { useEffect, useState } from 'react';
import TableItem from './table-item';
import { useGetPaymentDetails } from '@/hooks';
import { PaymentDetailResponseModel } from '@/types/data-model';
import { NoHistoryBox } from '@/ui';

interface TableProps {
  isPurchase: boolean;
  taxId: number;
}

const Table = ({ isPurchase, taxId }: TableProps) => {
  const { getPaymentDetails, isLoading } = useGetPaymentDetails();
  const [paymentDetails, setPaymentDetails] = useState<
    PaymentDetailResponseModel[]
  >([]);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!taxId) return;
      const result = await getPaymentDetails(taxId, {
        page: 1,
        page_size: 10,
      });
      if (result.success && result.data) {
        // 페이지네이션 응답에서 data 배열 추출
        setPaymentDetails(result.data.data || []);
      } else {
        // Reset to empty array on error
        setPaymentDetails([]);
      }
    };

    fetchPaymentDetails();
  }, [taxId, getPaymentDetails]);

  const remainHeader = isPurchase ? '미지급금(잔액)' : '미수금액(잔액)';
  const paidHeader = isPurchase ? '지급 금액' : '받은 금액';
  const expectedDateHeader = isPurchase ? '지급예정일' : '입금예정일';
  const dateHeader = isPurchase ? '지급일' : '입금일';

  if (isLoading) {
    return null;
  }

  // Ensure paymentDetails is always an array
  const safePaymentDetails = Array.isArray(paymentDetails)
    ? paymentDetails
    : [];

  return (
    <div>
      {safePaymentDetails.length === 0 ? (
        <NoHistoryBox
          text={isPurchase ? '지급 내역이 없습니다.' : '입금 내역이 없습니다.'}
        />
      ) : (
        <>
          {/* 표 헤더 */}
          <div className="text-sv flex items-center w-full h-12 border-t border-b border-lg Me_Body-1">
            <p className="flex-1 px-3">{expectedDateHeader}</p>
            <p className="flex-1 px-3">{dateHeader}</p>
            <p className="flex-1 px-3">{paidHeader}</p>
            <p className="flex-1 px-3">{remainHeader}</p>
            <p className="flex-1 px-3">연체일</p>
          </div>

          {/* 표 내용 */}
          {safePaymentDetails.map((item) => (
            <TableItem key={item.id} item={item} isPurchase={isPurchase} />
          ))}

          {/* 페이지네이션 */}
          {/* <Pagination ... /> */}
        </>
      )}
    </div>
  );
};

export default Table;
