"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MiniBtn from "@/ui/mini-btn";
import { taxData } from "@/mocks/tax-data";
import TaxItem from "./tax-item";
import TaxDetailPanel from "@/app/(with-layout)/tax/tax-detail-panel";

const Tax = () => {
  const router = useRouter();
  const [selectedTax, setSelectedTax] = useState<(typeof taxData)[0] | null>(
    null,
  );

  const handleTaxClick = (tax: (typeof taxData)[0]) => {
    setSelectedTax(tax);
  };

  const handleClosePanel = () => {
    setSelectedTax(null);
  };

  return (
    <>
      <div className="flex flex-col flex-1 min-w-0 gap-3">
        <div className="flex items-center justify-between">
          <h3 className="Heading-3">세금계산서 현황</h3>
          <MiniBtn
            text="더보기"
            textColor="text-dg"
            borderColor="border-lg"
            onClick={() => {
              router.push("/tax/list");
            }}
            hoverColor="hover:bg-bg"
          />
        </div>
        <div className="flex flex-col gap-3">
          {taxData
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .slice(0, 5)
            .map((tax) => (
              <TaxItem
                key={tax.id}
                taxType={tax.taxType}
                company={tax.company}
                date={tax.date}
                onClick={() => handleTaxClick(tax)}
              />
            ))}
        </div>
      </div>

      {selectedTax && (
        <TaxDetailPanel item={selectedTax} onClose={handleClosePanel} />
      )}
    </>
  );
};

export default Tax;
