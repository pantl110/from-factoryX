import ProductionPlanSaveModal from "./modals/production-plan-save-modal";
import TableHeader from "./table-header";
import TableItem from "./table-item";
import { productionPlanData } from "@/mocks/production-plan-data";
import usePageStatusStore from "@/store/page-status-store";

const ProductionPlan = () => {
  // production의 "생산 대기" 상태의 "생산 계획" 탭에서 저장 버튼 클릭 시 모달 오픈
  const isProductionPlanSaveModalOpen = usePageStatusStore(
    (state) => state.isProductionPlanSaveModalOpen,
  );
  const setProductionPlanSaveModalOpen = usePageStatusStore(
    (state) => state.setProductionPlanSaveModalOpen,
  );

  const handleProductionPlanSave = () => {
    // 생산 계획 저장 로직
    setProductionPlanSaveModalOpen(false);
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

      {isProductionPlanSaveModalOpen && (
        <ProductionPlanSaveModal
          onClose={() => {
            setProductionPlanSaveModalOpen(false);
          }}
          onSave={handleProductionPlanSave}
        />
      )}
    </>
  );
};

export default ProductionPlan;
