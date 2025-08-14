import ProductDetail from '@/app/(with-layout)/stock/product/product-detail';
import { ArrowLineUpRight, X } from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

interface TableItemFormData {
  quantity: number;
  unitPrice: number;
}

const TableItem = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { register, watch, setValue } = useFormContext<TableItemFormData>();

  // 폼 값 감시
  const quantity = watch('quantity') || 0;
  const unitPrice = watch('unitPrice') || 0;

  // 금액 자동 계산
  const totalAmount = quantity * unitPrice;

  // 천 단위 구분자 추가 함수
  const formatNumber = (value: number): string => {
    return value.toLocaleString();
  };

  // 입력값을 숫자로 변환하고 폼에 저장하는 함수
  const handleNumberInput = (
    field: 'quantity' | 'unitPrice',
    value: string
  ) => {
    const numericValue = value.replace(/,/g, '');
    const number = numericValue === '' ? 0 : Number(numericValue);
    if (!isNaN(number) && number >= 0) {
      setValue(field, number);
    }
  };

  return (
    <>
      <div className="group flex items-center h-14 border-b border-lg Me_Body-1 cursor-pointer">
        <div className="flex-1 px-3 flex items-center gap-1 min-w-0">
          <p className="text-dg truncate">품목명</p>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-bg transition-colors duration-200 group-hover:opacity-100 opacity-0"
            onClick={() => {
              setIsOpen(true);
            }}
          >
            <ArrowLineUpRight size={16} className="text-dg" />
          </button>
        </div>
        <p className="flex-1 px-3 text-dg truncate">규격</p>
        <p className="flex-1 px-3 text-dg truncate">품목 코드</p>
        <p className="w-[80px] px-3 text-dg truncate">단위</p>
        <div className="flex-1 px-3">
          <input
            type="text"
            value={formatNumber(quantity)}
            onChange={(e) => handleNumberInput('quantity', e.target.value)}
            placeholder="(필수)"
          />
        </div>
        <div className="w-[100px] px-3">
          <input
            type="text"
            value={formatNumber(unitPrice)}
            onChange={(e) => handleNumberInput('unitPrice', e.target.value)}
            placeholder="(필수)"
          />
        </div>
        <p className="flex-1 px-3 text-dg truncate">
          {totalAmount.toLocaleString()}
        </p>
        <button className="w-9 h-9 rounded-[8px] flex items-center justify-center hover:bg-bg">
          <X size={16} className="text-sv" />
        </button>
      </div>

      {isOpen && (
        <ProductDetail
          productId={null}
          onClose={() => {
            setIsOpen(false);
          }}
          onSuccess={() => {
            setIsOpen(false);
          }} // 품목 생성 시 품목id 전달
        />
      )}
    </>
  );
};

export default TableItem;
