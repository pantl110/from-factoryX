'use client';

import { useState } from 'react';
import {
  EquipmentListResponseModel,
  EquipmentResponseModel,
} from '@/types/data-model';
import FacilityTableHeader from './facility-table-header';
import FacilityTableItem from './facility-table-item';
import FacilityDetailPanel from './modals/facility-detail-panel';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react';
import useToast from '@/hooks/use-toast';
import NoHistoryBox from '@/ui/no-history-box';
import Pagination from '@/components/pagination';
import { useTranslations } from 'next-intl';

interface FacilityProps {
  equipmentList?: EquipmentListResponseModel;
  isLoading?: boolean;
  error?: string | null;
  isCreatePanelOpen?: boolean;
  setIsCreatePanelOpen?: (isOpen: boolean) => void;
  isAllChecked: boolean;
  isChecked: (id: number) => boolean;
  toggleAll: () => void;
  toggleOne: (id: number) => void;
  refetchEquipment?: () => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const Facility = ({
  equipmentList,
  isCreatePanelOpen = false,
  setIsCreatePanelOpen,
  isAllChecked,
  isChecked,
  toggleAll,
  toggleOne,
  refetchEquipment,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: FacilityProps) => {
  const tFacility = useTranslations('setting.masterData.facility');
  const [selectedEquipment, setSelectedEquipment] =
    useState<EquipmentResponseModel | null>(null);
  const { isToastOpen, isVisible, showToast } = useToast(2000);

  const handleItemClick = (facility: EquipmentResponseModel) => {
    setSelectedEquipment(facility);
  };

  const handlePanelClose = () => {
    setSelectedEquipment(null);
  };

  const handleCreatePanelClose = () => {
    setIsCreatePanelOpen?.(false);
  };

  // equipmentList에서 실제 배열 꺼내기
  const facilityList: EquipmentResponseModel[] = equipmentList?.data || [];

  return (
    <>
      <div className="w-full px-10 pb-10">
        {facilityList.length === 0 ? (
          <NoHistoryBox
            title={tFacility('empty.title')}
            text={tFacility('empty.description')}
          />
        ) : (
          <>
            <FacilityTableHeader
              isAllChecked={isAllChecked}
              onToggleAll={toggleAll}
            />
            {facilityList.map((item) => (
              <FacilityTableItem
                key={item.id}
                facility={item}
                onClick={() => handleItemClick(item)}
                isChecked={isChecked(item.id)}
                onToggle={() => toggleOne(item.id)}
              />
            ))}

            {/* 페이지네이션 */}
            {totalPages >= 2 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange || (() => {})}
              />
            )}
          </>
        )}
      </div>

      {/* 설비 상세 판넬 (기존 설비 조회) */}
      {selectedEquipment && (
        <FacilityDetailPanel
          facilityId={selectedEquipment.id}
          onClose={handlePanelClose}
          onSuccess={refetchEquipment}
          showWarningToast={showToast}
          facilityList={facilityList}
        />
      )}

      {/* 설비 생성 판넬 (빈 데이터) */}
      {isCreatePanelOpen && (
        <FacilityDetailPanel
          onClose={handleCreatePanelClose}
          onSuccess={refetchEquipment}
          showWarningToast={showToast}
          facilityList={facilityList}
        />
      )}

      {isToastOpen && (
        <Toast
          icon={<WarningCircle />}
          text={tFacility('toast.priorityConflict.text')}
          subtext={tFacility('toast.priorityConflict.subtext')}
          type="red"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default Facility;
