import { useState } from "react";
import ProductionPlanSaveModal from "./modals/production-plan-save-modal";
import TableHeader from "./table-header";
import TableItem from "./table-item";
import { productionPlanData } from "@/mocks/production-plan-data";

const ProductionPlan = () => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const handleSave = () => {
    // 저장 로직
    setIsSaveModalOpen(false);
  };

  return (
    <>
      <div className="mx-10 pt-4 pb-9">
        <div className="w-full overflow-x-auto">
          <TableHeader />
          {productionPlanData.map((item) => (
            <TableItem key={item.id} item={item} />
          ))}
        </div>
      </div>

      {isSaveModalOpen && (
        <ProductionPlanSaveModal
          onClose={() => {
            setIsSaveModalOpen(false);
          }}
          onSave={handleSave}
        />
      )}
    </>
  );
};

export default ProductionPlan;
