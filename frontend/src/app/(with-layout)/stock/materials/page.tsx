import MainTitleSec from "../main-title-sec";
import SearchDeleteTable from "@/ui/search-delete-table";
import TableHeader from "./table-header";
import TableItem from "./table-item";

const MaterialtockPage = () => {
  return (
    <div className="flex flex-col gap-8">
      <MainTitleSec selectedTab="materials" />
      <div className="px-8">
        <SearchDeleteTable />
        <div>
          <TableHeader />
          {[...Array(9)].map((_, index) => (
            <TableItem />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MaterialtockPage;
