"use client";

import { useRouter } from "next/navigation";
import MainTitleSec from "./main-title-sec";
import SearchDeleteTable from "@/app/(with-layout)/project/search-delete-table";
import TableHeader from "@/app/(with-layout)/project/table-header";
import TableItem from "@/app/(with-layout)/project/table-item";

const ProcessProjectPage = () => {
  const router = useRouter();

  const handleNewQuotation = () => {
    router.push("/quotation");
  };

  return (
    <div className="flex flex-col gap-8">
      <MainTitleSec onNewQuotation={handleNewQuotation} />
      <div className="px-8">
        <SearchDeleteTable />
        <div>
          <TableHeader lastLabel="납기일자" />
          {[...Array(9)].map((_, index) => (
            <TableItem
              key={index}
              status="생산 중"
              companyName="플라스틱이 좋아"
              items="플라스틱 컵 외 3개"
              startDate="2025-06-04"
              endDate="2025-06-04"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProcessProjectPage;
