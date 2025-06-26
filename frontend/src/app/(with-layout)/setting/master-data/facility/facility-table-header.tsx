import React from "react";

interface FacilityTableHeaderProps {
  isDeleteMode?: boolean;
}

const FacilityTableHeader = ({ isDeleteMode }: FacilityTableHeaderProps) => {
  return (
    <div className="flex h-12 items-center py-1 px-3 w-full border-t border-b border-[#eeeeee] Me_Body-1 text-sv px-3">
      {isDeleteMode && (
        <div
          className="flex items-center px-3"
          onClick={(e) => e.stopPropagation()}
        >
          <input type="checkbox" className="w-4 h-4 border-sv" />
        </div>
      )}
      <p className="flex-1 px-3">가동 상태</p>
      <p className="flex-1 px-3">설비명</p>
      <p className="flex-1 px-3">자동 배정 순위</p>
      <p className="flex-2 px-3">설비위치</p>
    </div>
  );
};

export default FacilityTableHeader;
