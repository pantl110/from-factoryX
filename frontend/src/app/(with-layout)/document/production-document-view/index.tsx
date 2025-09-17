import DocumentViewTitle from '../document-view-title';
import CommentItem from './comment-item';
import ProductionTableItem from './production-table-item';
import { useEffect, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useGetWorkInstruction } from '@/hooks';
import {
  WorkInstructionDetailPlanModel,
  WorkInstructionDetailResponseModel,
} from '@/types/data-model';

// 프로젝트명별로 그룹핑 함수
const groupByProject = (data: WorkInstructionDetailPlanModel[]) => {
  return data.reduce<Record<string, WorkInstructionDetailPlanModel[]>>(
    (acc, item) => {
      if (!acc[item.client_name]) acc[item.client_name] = [];
      acc[item.client_name].push(item);
      return acc;
    },
    {} as Record<string, WorkInstructionDetailPlanModel[]>
  );
};

interface ProductionDocumentViewProps {
  workInstructioId: number;
  isOnlyRead?: boolean;
  onMemoChange?: (memo: string) => void;
}

const ProductionDocumentView = ({
  workInstructioId,
  isOnlyRead = false,
  onMemoChange,
}: ProductionDocumentViewProps) => {
  const [workInstruction, setWorkInstruction] =
    useState<WorkInstructionDetailResponseModel | null>(null);
  const [value, setValue] = useState('');

  const { getWorkInstruction } = useGetWorkInstruction();
  useEffect(() => {
    if (workInstructioId) {
      getWorkInstruction(workInstructioId).then((res) => {
        if (res.success && res.data) {
          setWorkInstruction(res.data);
          const initialMemo = res.data.memo || '';
          setValue(initialMemo);
          if (onMemoChange) onMemoChange(initialMemo);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workInstructioId, getWorkInstruction]);

  const grouped = groupByProject(workInstruction?.plans || []);

  return (
    <div className="flex flex-col gap-6">
      <DocumentViewTitle
        title={`${new Date().toISOString().split('T')[0]} 생산 지시서`}
      />

      {/* 생산품목 - 프로젝트별로 표 분리 */}
      <div className="flex flex-col gap-6">
        {Object.entries(grouped).map(([projectName, items]) => (
          <div key={projectName} className="flex flex-col gap-3">
            <h3 className="Heading-3 h-10 items-center flex">{projectName}</h3>
            <div>
              <div className="w-full h-12 flex items-center bg-bg Me_Body-1 rounded text-sv">
                <p className="flex-2 px-3">품목명</p>
                <p className="flex-1 px-3">규격</p>
                <p className="w-[80px] px-3">단위</p>
                <p className="flex-1 px-3">생산수량</p>
                <p className="flex-[0.8] px-3">생산 설비</p>
                <p className="flex-[0.8] px-3">생산 시간</p>
              </div>
              {items.map((item, index) => (
                <ProductionTableItem
                  key={item.project + index}
                  productName={item.product_name}
                  spec={item.product_spec}
                  unit={item.product_unit}
                  productionQuantity={item.quantity || 0}
                  machine={item.equipment_name || '-'}
                  productionTime={
                    item.start_date.split('T')[1]?.slice(0, 5) || null
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 특이사항 */}
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3 h-10 items-center flex">특이사항</h3>
        {workInstruction?.plans
          .filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.product === item.product)
          )
          .map((item) => (
            <CommentItem
              key={item.product}
              title={item.product_name}
              comment={item.product_note || '-'}
            />
          ))}
      </div>

      {/* 메모 */}
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3 h-10 items-center flex">메모</h3>
        <TextareaAutosize
          placeholder={isOnlyRead ? '-' : '메모를 입력하세요.'}
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            setValue(v);
            if (onMemoChange) onMemoChange(v);
          }}
          className="w-full print:hidden"
          minRows={6}
          readOnly={isOnlyRead}
        />
        <div className="textarea hidden print:block whitespace-pre-wrap w-full min-h-50">
          {value}
        </div>
      </div>
    </div>
  );
};

export default ProductionDocumentView;
