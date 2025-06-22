import { TaxDocumentType } from "@/types/status-type";

interface MainTitleSecProps {
  selectedTaxType: TaxDocumentType | "전체";
  setSelectedTaxType: (type: TaxDocumentType | "전체") => void;
}

const MainTitleSec = ({
  selectedTaxType,
  setSelectedTaxType,
}: MainTitleSecProps) => {
  const tabs: (TaxDocumentType | "전체")[] = ["전체", "매출", "매입"];

  return (
    <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
      <div className="flex items-center justify-between">
        <div className="Heading-1 text-dg">세무/회계</div>
      </div>

      <div className="flex gap-4 items-center Heading-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`${
              selectedTaxType === tab ? "text-dg" : "text-gr"
            } cursor-pointer`}
            onClick={() => setSelectedTaxType(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MainTitleSec;
