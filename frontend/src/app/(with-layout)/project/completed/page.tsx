import MainTitleSec from "./main-title-sec";
import SearchDeleteTable from "@/app/(with-layout)/project/search-delete-table";
import TableHeader from "@/app/(with-layout)/project/table-header";
import TableItem from "@/app/(with-layout)/project/table-item";

const CompletedProjectPage = () => {
  return (
    <div>
      <MainTitleSec />
      <div className="px-8">
        <SearchDeleteTable />
        <div>
          <TableHeader lastLabel="완료일자" />
          {[...Array(9)].map((_, index) => (
            <TableItem
              key={index}
              status="완료"
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

export default CompletedProjectPage;
