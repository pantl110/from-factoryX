import MainTitleSec from "../main-title-sec";
import SearchDeleteTable from "@/ui/search-delete-table";
import TableHeader from "../materials/table-header";
import TableItem from "./table-item";

const ProductStockPage = () => {
  return (
    <div className="flex flex-col gap-8">
      <MainTitleSec selectedTab="product" />
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
  );
};

export default ProductStockPage;
