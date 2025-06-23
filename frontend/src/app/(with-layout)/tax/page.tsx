"use client";

import { useState } from "react";
import MainTitleSec from "./main-title-sec";
import SearchDeleteTable from "@/ui/search-delete-table";
import TableHeader from "./table-header";
import TableItem from "./table-item";
import TaxDetailPanel from "./tax-detail-panel";
import { taxData, TaxDataModel } from "@/mocks/tax-data";
import { TaxDocumentType } from "@/types/status-type";

const TaxPage = () => {
  const [selectedTaxType, setSelectedTaxType] = useState<
    TaxDocumentType | "전체"
  >("전체");
  const [selectedItem, setSelectedItem] = useState<TaxDataModel | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleOpenPanel = (item: TaxDataModel) => {
    setSelectedItem(item);
    setIsPanelOpen(true);
  };
  const handleClosePanel = () => {
    setSelectedItem(null);
    setIsPanelOpen(false);
  };

  const filteredData =
    selectedTaxType === "전체"
      ? taxData
      : taxData.filter((item) => item.taxType === selectedTaxType);

  return (
    <>
      <div className={`flex flex-col gap-8`}>
        <MainTitleSec
          selectedTaxType={selectedTaxType}
          setSelectedTaxType={setSelectedTaxType}
        />
        <div className="px-8">
          <SearchDeleteTable />
          <div className="w-full overflow-x-auto">
            <TableHeader />
            {filteredData.map((item) => (
              <TableItem
                key={item.id}
                onItemClick={() => handleOpenPanel(item)}
                taxType={item.taxType}
                date={item.date}
                company={item.company}
                supplyAmount={item.supplyAmount}
                taxAmount={item.taxAmount}
                totalAmount={item.totalAmount}
              />
            ))}
          </div>
        </div>
      </div>
      {isPanelOpen && selectedItem && (
        <TaxDetailPanel item={selectedItem} onClose={handleClosePanel} />
      )}
    </>
  );
};

export default TaxPage;
