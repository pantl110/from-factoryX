import MainTitleSec from "../main-title-sec";
import SearchDeleteTable from "@/ui/search-delete-table";
import TableHeader from "./table-header";
import TableItem from "./table-item";
import MaterialsDetail from "./materials-detail";

const MaterialtockPage = () => {
  return (
    <>
      <div className="flex flex-col gap-8">
        <MainTitleSec selectedTab="materials" />
        <div className="px-8">
          <SearchDeleteTable />
          <div>
            <TableHeader />
            {[...Array(9)].map((_, index) => (
              <TableItem key={index} />
            ))}
          </div>
        </div>
      </div>

      <MaterialsDetail />
    </>
  );
};

export default MaterialtockPage;
