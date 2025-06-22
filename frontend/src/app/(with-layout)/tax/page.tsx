"use client";

import { useState } from "react";
import TaxDetailPanel from "./tax-detail-panel";
import MainTitleSec from "./main-title-sec";
import SearchDeleteTable from "./search-delete-table";
import TableHeader from "./table-header";
import TableItem from "./table-item";

const TaxPage = () => {
  const [_selectedId, setSelectedId] = useState<number | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleTaxItemClick = (id: number) => {
    setSelectedId(id);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <>
      <div className={`flex flex-col gap-8`}>
        <MainTitleSec />
        <div className="px-8">
          <SearchDeleteTable />
          <div className="w-full overflow-x-auto">
            <TableHeader />
            {[...Array(9)].map((_, index) => (
              <TableItem
                key={index}
                id={index + 1}
                status="매출"
                date="2025-06-04"
                company="플라스틱이 좋아"
                supplyAmount="550,000"
                taxAmount="50,000"
                totalAmount="55,000"
                state="작성중"
                onClick={handleTaxItemClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 판넬 */}
      <TaxDetailPanel isPanelOpen={isPanelOpen} onClose={handleClosePanel} />
    </>
  );
};

export default TaxPage;
