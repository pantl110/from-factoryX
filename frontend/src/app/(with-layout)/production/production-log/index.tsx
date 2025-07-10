import { productionData } from "@/mocks/production-data";
import ProductionLogTableHeader from "./production-log-table-header";
import ProductionLogTableItem from "./production-log-table-item";

const ProductionLog = () => {
  return (
    <>
      <div className="flex flex-col w-full overflow-x-auto px-10 pt-5 pb-10">
        <ProductionLogTableHeader />
        {productionData.map((product) => (
          <ProductionLogTableItem key={product.id} product={product} />
        ))}
      </div>
    </>
  );
};

export default ProductionLog;
