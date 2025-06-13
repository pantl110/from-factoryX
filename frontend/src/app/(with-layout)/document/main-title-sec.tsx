import React from "react";
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
        <h3
          className={`cursor-pointer ${selectedType === "all" ? "text-dg" : "text-gr"}`}
          onClick={() => setSelectedType("all")}
        >
          전체
        </h3>
        <h3
          className={`cursor-pointer ${selectedType === "quotation" ? "text-dg" : "text-gr"}`}
          onClick={() => setSelectedType("quotation")}
        >
          견적서
        </h3>
        <h3
          className={`cursor-pointer ${selectedType === "production" ? "text-dg" : "text-gr"}`}
          onClick={() => setSelectedType("production")}
        >
          생산지시서
        </h3>
        <h3
          className={`cursor-pointer ${selectedType === "transaction" ? "text-dg" : "text-gr"}`}
          onClick={() => setSelectedType("transaction")}
        >
          거래명세서
        </h3>
      </div>
    </div>
  );
};

export default MainTitleSec;
