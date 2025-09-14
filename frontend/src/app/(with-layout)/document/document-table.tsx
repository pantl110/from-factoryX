import { CaretUpDownIcon } from '@phosphor-icons/react/dist/ssr';
import DocumentTableItem from './document-table-item';
import {
  PublishedTaxInvoiceResponseModel,
  ProjectResponseModel,
  WorkInstructionResponseModel,
} from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';

interface DocumentTableProps {
  data:
    | PublishedTaxInvoiceResponseModel[]
    | ProjectResponseModel[]
    | WorkInstructionResponseModel[];
  selectedType: string;
  onTaxSortChange?: (
    field: 'transaction_date' | 'created_at',
    direction: 'asc' | 'desc'
  ) => void;
  taxSortField: 'transaction_date' | 'created_at';
  taxSortDirection: 'asc' | 'desc';
  onProjectSortClick?: (direction: 'asc' | 'desc') => void;
  projectSortDirection?: 'asc' | 'desc';
  onWorkInstructionSortClick?: (direction: 'asc' | 'desc') => void;
  workInstructionSortDirection?: 'asc' | 'desc';
}

const DocumentTable = ({
  data,
  selectedType,
  onTaxSortChange,
  taxSortField,
  taxSortDirection,
  onProjectSortClick,
  projectSortDirection = 'desc',
  onWorkInstructionSortClick,
  workInstructionSortDirection = 'desc',
}: DocumentTableProps) => {
  const handleTaxSortClick = (field: 'transaction_date' | 'created_at') => {
    let newDirection: 'asc' | 'desc';
    if (taxSortField === field) {
      newDirection = taxSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      newDirection = 'desc';
    }

    // 부모 컴포넌트에 정렬 변경 알림
    onTaxSortChange?.(field, newDirection);
  };
  const handleProjectSortClick = () => {
    const newDirection = projectSortDirection === 'asc' ? 'desc' : 'asc';
    onProjectSortClick?.(newDirection);
  };
  const handleWorkInstructionSortClick = () => {
    const newDirection =
      workInstructionSortDirection === 'asc' ? 'desc' : 'asc';
    onWorkInstructionSortClick?.(newDirection);
  };

  const taxData = data as PublishedTaxInvoiceResponseModel[];
  const projectData = data as ProjectResponseModel[];
  const workInstructionData = data as WorkInstructionResponseModel[];

  return (
    <>
      {data.length === 0 ? (
        <NoHistoryBox
          title="문서가 아직 없어요."
          text="문서가 생성되면 이곳에 표시돼요."
        />
      ) : (
        <>
          <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
            {/* 세금계산서 일 때 */}
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
                  onClick={() => handleTaxSortClick('transaction_date')}
                >
                  <p className="">작성일자</p>
                  <CaretUpDownIcon size={21} className="text-sv" />
                </div>
                <div
                  className="px-3 w-[150px] h-full flex items-center gap-1 hover:bg-bg cursor-pointer"
                  onClick={() => handleTaxSortClick('created_at')}
                >
                  <p className="">등록일자</p>
                  <CaretUpDownIcon size={21} className="text-sv" />
                </div>
              </>
            ) : (
              // 주문서, 생산지시서, 거래명세서 일 떄
              <>
                <p className="px-3 flex-[0.5]">문서유형</p>
                <p className="px-3 flex-1">업체명</p>
                <p className="px-3 flex-1">품목명</p>
                <div
                  className="px-3 flex-[0.5] h-full flex items-center gap-1 hover:bg-bg cursor-pointer"
                  onClick={
                    selectedType === '생산지시서'
                      ? handleWorkInstructionSortClick
                      : handleProjectSortClick
                  }
                >
                  <p className="">등록일자</p>
                  <CaretUpDownIcon size={21} className="text-sv" />
                </div>
              </>
            )}
          </div>

          {(selectedType === '주문서' || selectedType === '거래명세서') &&
            projectData.map((item) => (
              <DocumentTableItem
                key={item.id}
                data={item}
                documentType={selectedType}
              />
            ))}
          {selectedType === '생산지시서' &&
            workInstructionData.map((item) => (
              <DocumentTableItem
                key={item.id}
                data={item}
                documentType={selectedType}
              />
            ))}

          {(selectedType === '매출 세금계산서' ||
            selectedType === '매입 세금계산서') &&
            taxData.map((item) => (
              <DocumentTableItem
                key={item.id}
                data={item}
                documentType={selectedType}
              />
            ))}
        </>
      )}
    </>
  );
};

export default DocumentTable;
