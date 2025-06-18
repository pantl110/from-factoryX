import SearchDeleteTable from "@/ui/search-delete-table";
import TableHeader from "./table-header";
import TableItem from "./table-item";
import MaterialDetail from "./material-detail";

const Material = () => {
  return (
    <>
      <SearchDeleteTable />
      <div>
        <TableHeader />
        {[...Array(9)].map((_, index) => (
          <TableItem key={index} />
        ))}
      </div>

      <MaterialDetail />
    </>
  );
};

export default Material;
