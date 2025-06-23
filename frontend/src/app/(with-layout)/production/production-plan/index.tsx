import TableHeader from "./table-header";
import TableItem from "./table-item";
import { productionPlanData } from "@/mocks/production-plan-data";

const ProductionPlan = () => {
  return (
    <div className="mx-10 pt-4 pb-9">
      <div className="w-full overflow-x-auto">
        <TableHeader />
        {productionPlanData.map((item) => (
          <TableItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default ProductionPlan;
