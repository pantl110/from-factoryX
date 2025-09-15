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
        <TableItem
          materialName="알루미늄 시트"
          materialCode="RM-001"
          unit="EA"
          currentStock={5000}
          status="충분"
          date="2025-06-04"
        />
        <TableItem
          materialName="투명 필름지"
          materialCode="RM-002"
          unit="m"
          currentStock={1200}
          status="부족"
          date="2025-06-04"
        />
        <TableItem
          materialName="실리콘 고무 패킹"
          materialCode="RM-018"
          unit="EA"
          currentStock={3500}
          status="충분"
          date="2025-06-04"
        />
        <TableItem
          materialName="절연 테이프"
          materialCode="RM-027"
          unit="롤"
          currentStock={80}
          status="부족"
          date="2025-06-04"
        />
      </div>

      <MaterialDetail />
    </>
  );
};

export default Material;
