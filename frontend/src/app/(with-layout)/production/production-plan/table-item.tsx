import Chip from '@/ui/chip';
import {
  OperationStatusColorMap,
  InventoryStatusColorMap,
} from '@/types/status-type';
import { ProductionPlanDataModel } from '@/mocks/production-plan-data';
import { tableHeader } from './types';
import { CaretDown } from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';
import ProductDetail from '../../stock/product/product-detail';
import { productData } from '@/mocks/product-data';
import { formatDateTime } from '@/hooks/format-number';

interface TableItemProps {
  item: ProductionPlanDataModel;
  onOperationStatusClick: (e: React.MouseEvent) => void;
  onFacilityClick: (e: React.MouseEvent) => void;
  onProductionQuantityChange?: (id: string, newQuantity: number) => void;
  onProductionTimeChange?: (id: string, newTime: string) => void;
  onEndDateChange?: (id: string, newDate: string) => void;
}

const TableItem = ({
  item,
  onOperationStatusClick,
  onFacilityClick,
  onProductionQuantityChange,
  onProductionTimeChange,
  onEndDateChange,
}: TableItemProps) => {
  const { operationStatus, materialStatus } = item;
  const operationColor = OperationStatusColorMap[operationStatus];
  const materialColor = InventoryStatusColorMap[materialStatus];
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [productionQuantity, setProductionQuantity] = useState(
    item.productionQuantity
  );
  const [productionTime, setProductionTime] = useState(item.productionTime);
  const [endDate, setEndDate] = useState(item.endDate);

  const handleProductionQuantityChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const cleanValue = e.target.value.replace(/,/g, '');
    const newQuantity = cleanValue === '' ? 0 : Number(cleanValue);

    if (!isNaN(newQuantity)) {
      setProductionQuantity(newQuantity);
      onProductionQuantityChange?.(String(item.id), newQuantity);
    }
  };

  const handleProductionTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const formatted = formatDateTime(e.target.value);
    setProductionTime(formatted);
    onProductionTimeChange?.(String(item.id), formatted);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateTime(e.target.value);
    setEndDate(formatted);
    onEndDateChange?.(String(item.id), formatted);
  };

  const itemData = {
    '가동 상태': (
      <Chip
        text={operationStatus}
        textColor={operationColor.textColor}
        bgColor={operationColor.bgColor}
        cursor="cursor-pointer"
        onClick={(e) => {
          if (e) {
            e.stopPropagation();
            onOperationStatusClick(e);
          }
        }}
      />
    ),
    품목명: item.productName,
    품목코드: item.productCode,
    규격: item.size,
    단위: item.unit,
    '주문 수량': item.orderQuantity.toLocaleString(),
    '생산 수량': (
      <input
        type="text"
        value={
          isNaN(productionQuantity) ? '0' : productionQuantity.toLocaleString()
        }
        onChange={handleProductionQuantityChange}
        className="w-full h-8 text-left border-none bg-transparent p-0"
        style={{ outline: 'none' }}
      />
    ),
    '생산 자재 상태': (
      <div className="flex gap-[27px]">
        <Chip
          text={materialStatus}
          textColor={
            operationStatus === '가동 완료'
              ? 'text-sv'
              : materialColor.textColor
          }
          bgColor={
            operationStatus === '가동 완료' ? 'bg-bg' : materialColor.bgColor
          }
        />
        <p
          className="cursor-pointer Re_Body-1 text-gr flex items-center opacity-0 hover:opacity-100 transition-opacity duration-200 ease-in-out"
          onClick={() => setIsProductDetailOpen(true)}
        >
          상세보기
        </p>
      </div>
    ),
    '생산 설비': (
      <div
        className={`flex items-center gap-2.5 ${
          operationStatus === '가동 완료' ? '' : 'cursor-pointer'
        }`}
        onClick={(e) => {
          if (e && operationStatus !== '가동 완료') {
            e.stopPropagation();
            onFacilityClick(e);
          }
        }}
      >
        <p>{item.facility}</p>
        <CaretDown size={16} className="text-sv" />
      </div>
    ),
    생산일자: (
      <input
        type="text"
        value={productionTime}
        onChange={handleProductionTimeChange}
        className={`w-full h-8 text-left border-none bg-transparent p-0 ${
          operationStatus === '가동 중지' ? 'text-red' : ''
        }`}
        style={{ outline: 'none' }}
        placeholder="YYYY-MM-DD 00:00"
      />
    ),
    '단위당 소요 시간': item.unitTime,
    '마감 예정일자': (
      <input
        type="text"
        value={endDate}
        onChange={handleEndDateChange}
        className={`w-full h-8 text-left border-none bg-transparent p-0 ${
          operationStatus === '가동 중지' ? 'text-red' : ''
        }`}
        style={{ outline: 'none' }}
        placeholder="YYYY-MM-DD 00:00"
      />
    ),
  };

  return (
    <>
      <div
        className={`flex items-center w-[1494px] h-12 border-b border-lg Me_Body-1 bg-whit ${
          operationStatus === '가동 완료' ? 'text-gr' : 'text-dg'
        }`}
      >
        {tableHeader.map((header) => (
          <div
            key={header.name}
            className={`${header.width} px-3 truncate ${
              header.name === '가동 상태' ? 'relative' : ''
            }`}
            title={String(itemData[header.name as keyof typeof itemData] ?? '')}
          >
            {itemData[header.name as keyof typeof itemData]}
          </div>
        ))}
      </div>

      {isProductDetailOpen && (
        <ProductDetail
          productId={item.id}
          onClose={() => setIsProductDetailOpen(false)}
        />
      )}
    </>
  );
};

export default TableItem;
