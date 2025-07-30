import { CaretUpDownIcon } from '@phosphor-icons/react/dist/ssr';
import DocumentTableItem from './document-table-item';
import { DocumentDataModel } from '@/mocks/document-data';
import Checkbox from '@/ui/checkbox';
import { useState } from 'react';

interface DocumentTableProps {
  data: DocumentDataModel[];
  onDocumentClick?: (document: DocumentDataModel) => void;
  isAllChecked: boolean;
  onToggleAll: () => void;
  isChecked: (id: string) => boolean;
  toggleOne: (id: string) => void;
  selectedType: string;
}

const DocumentTable = ({
  data,
  onDocumentClick,
  isAllChecked,
  onToggleAll,
  isChecked,
  toggleOne,
  selectedType,
}: DocumentTableProps) => {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [taxSortField, setTaxSortField] = useState<'writtenDate' | 'date'>(
    'date'
  );
  const [taxSortDirection, setTaxSortDirection] = useState<'asc' | 'desc'>(
    'desc'
  );

  const handleSortClick = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleTaxSortClick = (field: 'writtenDate' | 'date') => {
    if (taxSortField === field) {
      setTaxSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setTaxSortField(field);
      setTaxSortDirection('desc');
    }
  };

  // 일반 문서 정렬된 데이터 생성
  const sortedData = [...data].sort((a, b) => {
    if (sortDirection === 'asc') {
      return a.date.localeCompare(b.date);
    } else {
      return b.date.localeCompare(a.date);
    }
  });

  // 세금계산서 정렬된 데이터 생성
  const sortedTaxData = [...data].sort((a, b) => {
    const fieldA =
      taxSortField === 'writtenDate' ? a.writtenDate || '' : a.date;
    const fieldB =
      taxSortField === 'writtenDate' ? b.writtenDate || '' : b.date;

    if (taxSortDirection === 'asc') {
      return fieldA.localeCompare(fieldB);
    } else {
      return fieldB.localeCompare(fieldA);
    }
  });

  return (
    <div className="h-[608px]">
      <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
        <Checkbox
          isChecked={isAllChecked}
          onToggle={onToggleAll || (() => {})}
        />
        {selectedType === '매출 세금계산서' ||
        selectedType === '매입 세금계산서' ? (
          <>
            <p className="px-3 flex-2">업체명</p>
            <p className="px-3 flex-2">품목명</p>
            <p className="px-3 flex-2">공급가액</p>
            <p className="px-3 flex-2">세액</p>
            <p className="px-3 flex-2">합계금액</p>
            <div
              className="px-3 w-[150px] h-full flex items-center gap-1 hover:bg-bg cursor-pointer"
              onClick={() => handleTaxSortClick('writtenDate')}
            >
              <p className="">작성일자</p>
              <CaretUpDownIcon size={21} className="text-sv" />
            </div>
            <div
              className="px-3 w-[150px] h-full flex items-center gap-1 hover:bg-bg cursor-pointer"
              onClick={() => handleTaxSortClick('date')}
            >
              <p className="">등록일자</p>
              <CaretUpDownIcon size={21} className="text-sv" />
            </div>
          </>
        ) : (
          <>
            <p className="px-3 flex-[0.5]">문서유형</p>
            <p className="px-3 flex-1">업체명</p>
            <p className="px-3 flex-1">품목명</p>
            <div
              className="px-3 flex-[0.5] h-full flex items-center gap-1 hover:bg-bg cursor-pointer"
              onClick={handleSortClick}
            >
              <p className="">등록일자</p>
              <CaretUpDownIcon size={21} className="text-sv" />
            </div>
          </>
        )}
      </div>

      {selectedType === '매출 세금계산서' || selectedType === '매입 세금계산서'
        ? sortedTaxData.map((item, index) => (
            <DocumentTableItem
              key={index}
              data={item}
              onClick={() => onDocumentClick?.(item)}
              checked={isChecked(item.id)}
              onToggle={() => toggleOne(item.id)}
              isTaxDocument={true}
            />
          ))
        : sortedData.map((item, index) => (
            <DocumentTableItem
              key={index}
              data={item}
              onClick={() => onDocumentClick?.(item)}
              checked={isChecked(item.id)}
              onToggle={() => toggleOne(item.id)}
            />
          ))}
    </div>
  );
};

export default DocumentTable;
