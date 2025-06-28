"use client";

import { useState } from "react";
import { facilityData, FacilityDataModel } from "@/mocks/facility-data";
import FacilityTableHeader from "./facility-table-header";
import FacilityTableItem from "./facility-table-item";
import FacilityDetailPanel from "./modals/facility-detail-panel";

interface FacilityProps {
  isDeleteMode?: boolean;
}

const Facility = ({ isDeleteMode }: FacilityProps) => {
  const [selectedFacility, setSelectedFacility] =
    useState<FacilityDataModel | null>(null);

  const handleItemClick = (facility: FacilityDataModel) => {
    setSelectedFacility(facility);
  };
  const handlePanelClose = () => {
    setSelectedFacility(null);
  };

  return (
    <>
      <div className="w-full px-10">
        <FacilityTableHeader isDeleteMode={isDeleteMode} />
        {facilityData.map((item) => (
          <FacilityTableItem
            key={item.id}
            {...item}
            isDeleteMode={isDeleteMode}
            onClick={() => handleItemClick(item)}
          />
        ))}
      </div>

      {/* 설비 상세 판넬 */}
      {selectedFacility && (
        <FacilityDetailPanel
          facility={selectedFacility}
          onClose={handlePanelClose}
        />
      )}
    </>
  );
};

export default Facility;
