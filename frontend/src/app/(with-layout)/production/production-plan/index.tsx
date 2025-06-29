"use client";

import { useState } from "react";
import ProductionPlanSaveModal from "./modals/production-plan-save-modal";
import TableHeader from "./table-header";
import TableItem from "./table-item";
import { productionPlanData } from "@/mocks/production-plan-data";
import usePageStatusStore from "@/store/page-status-store";
import OperationStatusDropdown from "./modals/operation-status-dropdown";
import { createPortal } from "react-dom";
import { usePortalDropdown } from "@/hooks/use-portal-dropdown";
import FacilityDropdown from "./modals/facility-dropdown";

const ProductionPlan = () => {
  // production의 "생산 대기" 상태의 "생산 계획" 탭에서 저장 버튼 클릭 시 모달 오픈
  const isProductionPlanSaveModalOpen = usePageStatusStore(
    (state) => state.isProductionPlanSaveModalOpen,
  );
  const setProductionPlanSaveModalOpen = usePageStatusStore(
    (state) => state.setProductionPlanSaveModalOpen,
  );
  // 가동상태 드랍다운운을 row별로 관리
  const {
    isOpen: isOperationStatusDropdownOpen,
    openDropdown: openOperationStatusDropdown,
    closeDropdown: closeOperationStatusDropdown,
    anchorRect: operationStatusAnchorRect,
  } = usePortalDropdown();
  const [operationStatusDropdownRowId, setOperationStatusDropdownRowId] =
    useState<number | null>(null);
  const handleOperationStatusClick = (e: React.MouseEvent, rowId: number) => {
    openOperationStatusDropdown(e);
    setOperationStatusDropdownRowId(rowId);
  };
  const handleCloseOperationStatusModal = () => {
    setOperationStatusDropdownRowId(null);
    closeOperationStatusDropdown();
  };

  // 시설 드랍다운을 row별로 관리
  const {
    isOpen: isFacilityDropdownOpen,
    openDropdown: openFacilityDropdown,
    closeDropdown: closeFacilityDropdown,
    anchorRect: facilityAnchorRect,
  } = usePortalDropdown();
  const [facilityDropdownRowId, setFacilityDropdownRowId] = useState<
    number | null
  >(null);
  const handleFacilityClick = (e: React.MouseEvent, rowId: number) => {
    openFacilityDropdown(e);
    setFacilityDropdownRowId(rowId);
  };
  const handleCloseFacilityModal = () => {
    setFacilityDropdownRowId(null);
    closeFacilityDropdown();
  };

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
            <TableItem
              key={item.id}
              item={item}
              onOperationStatusClick={(e) =>
                handleOperationStatusClick(e, item.id)
              }
              onFacilityClick={(e) => handleFacilityClick(e, item.id)}
            />
          ))}
        </div>
      </div>

      {operationStatusDropdownRowId !== null &&
        isOperationStatusDropdownOpen &&
        operationStatusAnchorRect &&
        createPortal(
          <OperationStatusDropdown
            onClose={handleCloseOperationStatusModal}
            style={{
              position: "fixed",
              left: operationStatusAnchorRect.left,
              top: operationStatusAnchorRect.bottom,
              zIndex: 10,
            }}
          />,
          document.body,
        )}

      {facilityDropdownRowId !== null &&
        isFacilityDropdownOpen &&
        facilityAnchorRect &&
        createPortal(
          <FacilityDropdown
            onClose={handleCloseFacilityModal}
            style={{
              position: "fixed",
              left: facilityAnchorRect.left,
              top: facilityAnchorRect.bottom,
              zIndex: 10,
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
