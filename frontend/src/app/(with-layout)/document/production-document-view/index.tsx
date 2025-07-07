import { productionData } from "@/mocks/production-data";
import DocumentViewTitle from "../document-view-title";
import CommentItem from "./comment-item";
import ProductionTableItem from "./production-table-item";
import { useState } from "react";

// 프로젝트명별로 그룹핑 함수
const groupByProject = (data: typeof productionData) => {
  return data.reduce<Record<string, typeof productionData>>( (acc, item) => {
    if (!acc[item.projectName]) acc[item.projectName] = [];
    acc[item.projectName].push(item);
    return acc;
  }, {} as Record<string, typeof productionData>);
};

const ProductionDocumentView = () => {
  const [value, setValue] = useState("");
  const grouped = groupByProject(productionData);

  return (
    <div className="flex flex-col gap-6">
      <DocumentViewTitle title="2025-06-13 생산 지시서" />

      {/* 생산품목 - 프로젝트별로 표 분리 */}
      <div className="flex flex-col gap-6">
        {Object.entries(grouped).map(([projectName, items]) => (
          <div key={projectName} className="flex flex-col gap-3">
            <h3 className="Heading-3">{projectName}</h3>
            <div>
              <div className="w-full h-12 flex items-center bg-bg Me_Body-1 rounded text-sv">
                <p className="flex-2 px-3">품목명</p>
                <p className="flex-1 px-3">규격</p>
                <p className="w-[80px] px-3">단위</p>
                <p className="flex-1 px-3">생산수량</p>
                <p className="flex-[0.8] px-3">생산 설비</p>
                <p className="flex-[0.8] px-3">생산 시간</p>
              </div>
              {(items as typeof productionData).map((item) => (
                <ProductionTableItem
                  key={item.id}
                  productName={item.productName}
                  standard={item.standard}
                  unit={item.unit}
                  productionQuantity={item.productionQuantity || 0}
                  machine={item.machine || "-"}
                  productionTime={item.productionTime || "-"}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 특이사항 */}
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3">특이사항</h3>
        <CommentItem
          title="A 품목"
          comment="입고 시 포장 파손, 날개 검수 필요"
        />
        <CommentItem
          title="B 품목"
          comment="입고 시 포장 파손, 날개 검수 필요"
        />
      </div>

      {/* 메모 */}
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3">메모</h3>
        <textarea
          placeholder="메모를 입력하세요."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full min-h-50 print:hidden overflow-hidden"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = target.scrollHeight + "px";
          }}
        />
        <div className="textarea hidden print:block whitespace-pre-wrap w-full min-h-50">
          {value}
        </div>
      </div>
    </div>
  );
};

export default ProductionDocumentView;
