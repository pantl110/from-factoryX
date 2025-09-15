import SearchDeleteTable from "@/ui/search-delete-table";
import TableHeader from "../product/table-header";
import TableItem from "./table-item";
import ProductDetail from "./product-detail";

const Product = () => {
  return (
    <>
      <SearchDeleteTable />
      <div>
        <TableHeader />
        <TableItem
          productName="투명 아크릴판"
          productCode="PRM-001"
          size="100x300mm"
          unit="EA"
          stock={2500}
        />
        <TableItem
          productName="고무 패킹"
          productCode="PRM-002"
          size="∅20"
          unit="EA"
          stock={6300}
        />
        <TableItem
          productName="금속 연결 부품"
          productCode="PRM-003"
          size="50x30mm"
          unit="SET"
          stock={420}
        />
        <TableItem
          productName="방열 테이프"
          productCode="PRM-004"
          size="5cmx20m"
          unit="롤"
          stock={180}
        />
      </div>

      <ProductDetail />
    </>
  );
};

export default Product;
