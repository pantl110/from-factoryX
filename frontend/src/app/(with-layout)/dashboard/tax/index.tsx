"use client";

import MiniBtn from "@/ui/mini-btn";
import TaxItem from "./tax-item";
import { useRouter } from "next/navigation";
import { taxData } from "@/mocks/tax-data";

const Tax = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col flex-1 gap-3">
      <div className="flex items-center justify-between">
        <h3 className="Heading-3">세무/회계</h3>
        <MiniBtn
          text="더보기"
          textColor="text-dg"
          borderColor="border-lg"
          onClick={() => {
            router.push("/tax");
          }}
        />
      </div>
      <div className="flex flex-col gap-3">
        {taxData.map((tax) => (
          <TaxItem
            key={tax.id}
            taxType={tax.taxType}
            company={tax.company}
            date={tax.date}
          />
        ))}
      </div>
    </div>
  );
};

export default Tax;
