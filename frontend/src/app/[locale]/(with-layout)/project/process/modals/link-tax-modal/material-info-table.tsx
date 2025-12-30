import { TaxLineItemModel } from '@/types/data-model';
import React from 'react';

interface MaterialInfoTableProps {
  lineItem: TaxLineItemModel;
}

const MaterialInfoTable = ({ lineItem }: MaterialInfoTableProps) => {
  return (
    <div>
      <div className="text-sv flex items-center w-full h-12 border-t border-b border-lg Me_Body-1">
        <p className="flex-2 px-3">자재명</p>
        <p className="flex-2 px-3">규격</p>
        <p className="flex-1 px-3">수량</p>
        <p className="flex-1 px-3">단가</p>
        <p className="flex-[1.5] px-3">공급가액</p>
        <p className="flex-[1.5] px-3">세액</p>
        <p className="flex-[1.5] px-3">금액</p>
      </div>
      <div className="flex items-center h-14 w-full text-bl Me_Body-1 border-b border-lg">
        <p className="flex-2 px-3 text-dg truncate" title={lineItem.name}>
          {lineItem.name || '-'}
        </p>
        <p
          className="flex-2 px-3 text-dg truncate"
          title={lineItem.information}
        >
          {lineItem.information || '-'}
        </p>
        <p
          className="flex-1 px-3 text-dg truncate"
          title={lineItem.chargeable_unit}
        >
          {lineItem.chargeable_unit || '-'}
        </p>
        <p
          className="flex-1 px-3 text-dg truncate"
          title={Number(lineItem.unit_price).toLocaleString()}
        >
          {Number(lineItem.unit_price).toLocaleString() || '-'}
        </p>
        <p
          className="flex-[1.5] px-3 text-dg truncate"
          title={Number(lineItem.amount).toLocaleString()}
        >
          {Number(lineItem.amount).toLocaleString() || '-'}
        </p>
        <p
          className="flex-[1.5] px-3 text-dg truncate"
          title={Number(lineItem.tax).toLocaleString()}
        >
          {Number(lineItem.tax).toLocaleString() || '-'}
        </p>
        <p
          className="flex-[1.5] px-3 text-dg truncate"
          title={(
            Number(lineItem.amount) + Number(lineItem.tax)
          ).toLocaleString()}
        >
          {(Number(lineItem.amount) + Number(lineItem.tax)).toLocaleString() ||
            '-'}
        </p>
      </div>
    </div>
  );
};

export default MaterialInfoTable;
