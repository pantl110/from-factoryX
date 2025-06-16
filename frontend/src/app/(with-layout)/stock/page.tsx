import SearchDeleteTable from "../tax/search-delete-table";
import MainTitleSec from "./main-title-sec";
import TableHeader from "./table-header";

const StockPage = () => {
  return (
    <div className="flex flex-col gap-8">
      <MainTitleSec />
      <div className="px-8">
        <SearchDeleteTable />
        <div>
          <TableHeader />
          {/* {[...Array(9)].map((_, index) => (
            <TableItem
              key={index}
              status="생산 중"
              companyName="플라스틱이 좋아"
              items="플라스틱 컵 외 3개"
              startDate="2025-06-04"
              endDate="2025-06-04"
            />
          ))} */}
        </div>
      </div>
    </div>
  );
};

export default StockPage;
