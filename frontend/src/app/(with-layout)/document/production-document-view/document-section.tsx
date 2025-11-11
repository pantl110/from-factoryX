import React from 'react';
import ProductionTableItem from './production-table-item';
import CommentItem from './comment-item';
import TextareaAutosize from 'react-textarea-autosize';
import { convertUTCToKST } from '@/hooks';
import {
  WorkInstructionDetailPlanModel,
  WorkInstructionDetailResponseModel,
} from '@/types/data-model';

interface DocumentSectionProps {
  grouped: Record<string, WorkInstructionDetailPlanModel[]>;
  workInstruction: WorkInstructionDetailResponseModel;
  isOnlyRead: boolean;
  value: string;
  setValue: (value: string) => void;
  onMemoChange?: (memo: string) => void;
}

export const DocumentSection = ({
  grouped,
  workInstruction,
  isOnlyRead,
  value,
  setValue,
  onMemoChange,
}: DocumentSectionProps) => {
  return (
    <>
      {/* 생산제품 - 프로젝트별로 표 분리 */}
      <div className="flex flex-col gap-6">
        {Object.entries(grouped).map(([projectName, items]) => (
          <div key={projectName} className="flex flex-col gap-3">
            <h3 className="Heading-3 h-10 items-center flex">{projectName}</h3>
            <div>
              <div className="w-full h-12 flex items-center bg-bg Me_Body-1 rounded text-sv cursor-default">
                <p className="flex-2 px-3">제품명</p>
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
                    convertUTCToKST(item.start_date)?.split(' ')[1] || null
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
              index ===
              self.findIndex((t) => t.product_code === item.product_code)
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
          className={`w-full print:hidden ${isOnlyRead ? 'cursor-default !border-lg focus:!border-lg' : 'focus:!border-primary'}`}
          minRows={6}
          readOnly={isOnlyRead}
        />
        <div className="textarea hidden print:block whitespace-pre-wrap w-full min-h-50">
          {value}
        </div>
      </div>
    </>
  );
};
