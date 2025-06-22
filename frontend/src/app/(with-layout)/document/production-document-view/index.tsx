import DocumentViewTitle from "../document-view-title";
import ProductionTableItem from "./production-table-item";

const ProductionDocumentView = () => {
  return (
    <div className="flex flex-col gap-6">
      <DocumentViewTitle
        title="생산 지시서"
        dateLabel="생산일자"
        date="2025-07-31"
      />

      <div className="flex flex-col gap-3">
        <h3 className="Heading-3">생산 품목</h3>
        <div>
          <div className="w-full h-12 flex items-center bg-bg Me_Body-1 rounded text-sv">
            <p className="flex-1 px-3">품목정보</p>
            <p className="flex-1 px-3">품목코드</p>
            <p className="flex-1 px-3">규격</p>
            <p className="w-[80px] px-3">단위</p>
            <p className="flex-1 px-3">생산수량</p>
            <p className="w-[120px] px-3">생산 설비</p>
            <p className="w-[80px] px-3">담장자</p>
            <p className="flex-1 px-3">생산시간</p>
          </div>
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductionTableItem key={index} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="Heading-3">작업 특이사항</h3>
        <textarea
          placeholder="특이사항을을 입력하세요."
          //   value={value}
          //   onChange={(e) => onChange?.(e.target.value)}
          className="w-full min-h-50 rounded px-3 py-5 Re_Body-1 text-dg placeholder:text-sv outline-none border border-[#e4e4e7] hover:border-primary focus:border-gr focus:text-dg transition-colors"
        />
      </div>
    </div>
  );
};

export default ProductionDocumentView;
