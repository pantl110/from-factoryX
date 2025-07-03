"use client";

import { useState } from "react";
import { facilityData, FacilityDataModel } from "@/mocks/facility-data";
import FacilityTableHeader from "./facility-table-header";
import FacilityTableItem from "./facility-table-item";
import FacilityDetailPanel from "./modals/facility-detail-panel";
import { FacilityStatusType } from "./types";

interface FacilityProps {
  isDeleteMode?: boolean;
  isCreatePanelOpen?: boolean;
  setIsCreatePanelOpen?: (isOpen: boolean) => void;
}

const Facility = ({
  isDeleteMode,
  isCreatePanelOpen = false,
  setIsCreatePanelOpen,
}: FacilityProps) => {
  const [selectedFacility, setSelectedFacility] =
    useState<FacilityDataModel | null>(null);

  const handleItemClick = (facility: FacilityDataModel) => {
    setSelectedFacility(facility);
  };

  const handlePanelClose = () => {
    setSelectedFacility(null);
  };

  const handleCreatePanelClose = () => {
    setIsCreatePanelOpen?.(false);
  };

  // 빈 설비 데이터 (새 설비 생성용)
  const emptyFacility: FacilityDataModel = {
    id: 0,
    name: "",
    status: "가동 대기" as FacilityStatusType,
    priority: null,
    location: "",
  };

  return (
    <>
      <div className="w-full px-10">
        <FacilityTableHeader isDeleteMode={isDeleteMode} />
        {facilityData.map((item) => (
          <FacilityTableItem
            key={item.id}
            facility={item}
            isDeleteMode={isDeleteMode}
            onClick={() => handleItemClick(item)}
          />
        ))}
      </div>

      {/* 설비 상세 판넬 (기존 설비 조회) */}
      {selectedFacility && (
        <FacilityDetailPanel
          facility={selectedFacility}
          onClose={handlePanelClose}
        />
      )}

      {/* 설비 생성 판넬 (빈 데이터) */}
      {isCreatePanelOpen && (
        <FacilityDetailPanel
          facility={emptyFacility}
          onClose={handleCreatePanelClose}
        />
      )}
    </>
  );
};

export default Facility;
