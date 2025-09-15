import { DocumentType } from "./types";

interface MainTitleSecProps {
  selectedType: DocumentType;
  setSelectedType: (type: DocumentType) => void;
}

const MainTitleSec = ({ selectedType, setSelectedType }: MainTitleSecProps) => {
  return (
    <div className="flex flex-col gap-8 pt-10 px-10">
      <h1 className="Heading-1 text-dg">문서함</h1>
      <div className="flex gap-4 items-center Heading-3">
        <button
          type="button"
          className={`cursor-pointer ${selectedType === "all" ? "text-dg" : "text-gr"} Heading-3`}
          onClick={() => setSelectedType("all")}
        >
          전체
        </button>
        <button
          type="button"
          className={`cursor-pointer ${selectedType === "quotation" ? "text-dg" : "text-gr"} Heading-3`}
          onClick={() => setSelectedType("quotation")}
        >
          견적서
        </button>
        <button
          type="button"
          className={`cursor-pointer ${selectedType === "production" ? "text-dg" : "text-gr"} Heading-3`}
          onClick={() => setSelectedType("production")}
        >
          생산지시서
        </button>
        <button
          type="button"
          className={`cursor-pointer ${selectedType === "transaction" ? "text-dg" : "text-gr"} Heading-3`}
          onClick={() => setSelectedType("transaction")}
        >
          거래명세서
        </button>
      </div>
    </div>
  );
};

export default MainTitleSec;
