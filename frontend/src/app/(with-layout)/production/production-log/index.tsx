import ProductionLogTableHeader from "./production-log-table-header";
import ProductionLogTableItem from "./production-log-table-item";

const ProductionLog = () => {
  return (
    <div className="flex flex-col px-10 pt-4 pb-9">
      <ProductionLogTableHeader />
      <ProductionLogTableItem />
      <ProductionLogTableItem />
      <ProductionLogTableItem />
      <ProductionLogTableItem />
      <ProductionLogTableItem />
      <ProductionLogTableItem />
      <ProductionLogTableItem />
      <ProductionLogTableItem />
    </div>
  );
};

export default ProductionLog;
