import DocumentViewTitle from '../document-view-title';
import CommentItem from './comment-item';
import ProductionTableItem from './production-table-item';
import { useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { TodayProductionPlanModel } from '@/app/(with-layout)/dashboard/type';

// 프로젝트명별로 그룹핑 함수
const groupByProject = (data: TodayProductionPlanModel[]) => {
  return data.reduce<Record<string, TodayProductionPlanModel[]>>(
    (acc, item) => {
      if (!acc[item.company_name]) acc[item.company_name] = [];
      acc[item.company_name].push(item);
      return acc;
    },
    {} as Record<string, TodayProductionPlanModel[]>
  );
};

interface ProductionDocumentViewProps {
  todayProductionPlans: TodayProductionPlanModel[];
}

const ProductionDocumentView = ({
  todayProductionPlans,
}: ProductionDocumentViewProps) => {
  const [value, setValue] = useState('');
  const grouped = groupByProject(todayProductionPlans);

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
                  key={item.project_id + index}
                  productName={item.product_name}
                  spec={item.spec}
                  unit={item.unit}
                  productionQuantity={item.production_quantity || 0}
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
        {todayProductionPlans
          .filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.product_id === item.product_id)
          )
          .map((item) => (
            <CommentItem
              key={item.product_id}
              title={item.product_name}
              comment={item.product_note || '-'}
            />
          ))}
      </div>

      {/* 메모 */}
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3 h-10 items-center flex">메모</h3>
        <TextareaAutosize
          placeholder="메모를 입력하세요."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full print:hidden"
          minRows={6}
        />
        <div className="textarea hidden print:block whitespace-pre-wrap w-full min-h-50">
          {value}
        </div>
      </div>
    </div>
  );
};

export default ProductionDocumentView;
