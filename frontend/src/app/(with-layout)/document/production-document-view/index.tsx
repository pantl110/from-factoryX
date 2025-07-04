import { productionData } from "@/mocks/production-data";
import DocumentViewTitle from "../document-view-title";
import CommentItem from "./comment-item";
import ProductionTableItem from "./production-table-item";
import { useState } from "react";

const ProductionDocumentView = () => {
  const [value, setValue] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <DocumentViewTitle title="2025-06-13 생산 지시서" />

      {/* 생산품목 */}
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3">생산 품목</h3>
        <div>
          <div className="w-full h-12 flex items-center bg-bg Me_Body-1 rounded text-sv">
            <p className="flex-1 px-3">품목명</p>
            <p className="flex-1 px-3">규격</p>
            <p className="w-[80px] px-3">단위</p>
            <p className="flex-1 px-3">생산수량</p>
            <p className="w-[120px] px-3">생산 설비</p>
            <p className="flex-1 px-3">생산 일자</p>
          </div>
          {productionData.map((item) => (
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
