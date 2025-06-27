import { productionData } from "@/mocks/production-data";
import ProductionLogTableHeader from "./production-log-table-header";
import ProductionLogTableItem from "./production-log-table-item";

const ProductionLog = () => {
  return (
    <div className="flex flex-col ml-10 pr-10 pt-4 pb-9 overflow-x-auto w-full">
      <ProductionLogTableHeader />
      {productionData.map((product) => (
        <ProductionLogTableItem key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductionLog;
