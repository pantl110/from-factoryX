"use client";

import { useState } from "react";
import ProductionPlanSaveModal from "./modals/production-plan-save-modal";
import TableHeader from "./table-header";
import TableItem from "./table-item";
import { productionPlanData } from "@/mocks/production-plan-data";
import usePageStatusStore from "@/store/page-status-store";
import OperationStatusDropdown from "./modals/operation-status-dropdown";
import { createPortal } from "react-dom";

const ProductionPlan = () => {
  // production의 "생산 대기" 상태의 "생산 계획" 탭에서 저장 버튼 클릭 시 모달 오픈
  const isProductionPlanSaveModalOpen = usePageStatusStore(
    (state) => state.isProductionPlanSaveModalOpen,
  );
  const setProductionPlanSaveModalOpen = usePageStatusStore(
    (state) => state.setProductionPlanSaveModalOpen,
  );
  // 가동상태 드랍다운운을 row별로 관리
  const [operationStatusDropdownRowId, setOperationStatusDropdownRowId] =
    useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const handleProductionPlanSave = () => {
    // 생산 계획 저장 로직
    setProductionPlanSaveModalOpen(false);
  };

  const handleOperationStatusClick = (e: React.MouseEvent, rowId: number) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDropdownPosition({
      left: rect.left,
      top: rect.bottom,
    });
    setOperationStatusDropdownRowId(rowId);
  };
  const handleCloseOperationStatusModal = () => {
    setOperationStatusDropdownRowId(null);
    setDropdownPosition(null);
  };

  return (
    <>
      <div className="mx-10 pt-4 pb-9">
        <div className="w-full overflow-x-auto">
          <TableHeader />
          {productionPlanData.map((item) => (
            <TableItem
              key={item.id}
              item={item}
              onOperationStatusClick={(e) =>
                handleOperationStatusClick(e, item.id)
              }
            />
          ))}
        </div>
      </div>

      {operationStatusDropdownRowId !== null &&
        dropdownPosition &&
        createPortal(
          <OperationStatusDropdown
            onClose={handleCloseOperationStatusModal}
            style={{
              position: "fixed",
              left: dropdownPosition.left,
              top: dropdownPosition.top,
              zIndex: 50,
            }}
          />,
          document.body,
        )}

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
