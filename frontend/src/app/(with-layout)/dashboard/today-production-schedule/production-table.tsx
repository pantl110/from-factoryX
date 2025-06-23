import ProductionTableHeader from "./production-table-header";
import ProductionTableItem from "./production-table-item";

const ProductionTable = () => {
  return (
    <>
      <ProductionTableHeader />
      <ProductionTableItem
        status="생산 완료"
        productName="A품목"
        productCode="P-001"
        size="500ml"
        unit="EA"
        quantity={5000}
        machine="1호기"
        time="09:00-13:00"
      />
      <ProductionTableItem
        status="생산 중"
        productName="A품목"
        productCode="P-001"
        size="500ml"
        unit="EA"
        quantity={5000}
        machine="1호기"
        time="09:00-13:00"
      />
      <ProductionTableItem
        status="가동 대기"
        productName="A품목"
        productCode="P-001"
        size="500ml"
        unit="EA"
        quantity={5000}
        machine="1호기"
        time="09:00-13:00"
      />
      <ProductionTableItem
        status="생산 완료"
        productName="A품목"
        productCode="P-001"
        size="500ml"
        unit="EA"
        quantity={5000}
        machine="1호기"
        time="09:00-13:00"
      />
    </>
  );
};

export default ProductionTable;
