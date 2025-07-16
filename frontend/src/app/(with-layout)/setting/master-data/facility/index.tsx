'use client'

import { useState } from 'react'
import { EquipmentListResponseModel, EquipmentResponseModel } from '@/types/data-model'
import FacilityTableHeader from './facility-table-header'
import FacilityTableItem from './facility-table-item'
import FacilityDetailPanel from './modals/facility-detail-panel'

interface FacilityProps {
  equipmentList?: EquipmentListResponseModel
  isLoading?: boolean
  error?: string | null
  isCreatePanelOpen?: boolean
  setIsCreatePanelOpen?: (isOpen: boolean) => void
  isAllChecked: boolean
  isChecked: (id: number) => boolean
  toggleAll: () => void
  toggleOne: (id: number) => void
  refetchEquipment?: () => void
}

const Facility = ({
  equipmentList,
  isLoading = false,
  error = null,
  isCreatePanelOpen = false,
  setIsCreatePanelOpen,
  isAllChecked,
  isChecked,
  toggleAll,
  toggleOne,
  refetchEquipment,
}: FacilityProps) => {
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentResponseModel | null>(null)

  const handleItemClick = (facility: EquipmentResponseModel) => {
    setSelectedEquipment(facility)
  }

  const handlePanelClose = () => {
    setSelectedEquipment(null)
  }

  const handleCreatePanelClose = () => {
    setIsCreatePanelOpen?.(false)
  }

  // equipmentList에서 실제 배열 꺼내기
  const facilityList: EquipmentResponseModel[] = equipmentList?.data || []

  return (
    <>
      <div className="w-full px-10 pb-10">
        <FacilityTableHeader isAllChecked={isAllChecked} onToggleAll={toggleAll} />
        {facilityList.map((item) => (
          <FacilityTableItem
            key={item.id}
            facility={item}
            onClick={() => handleItemClick(item)}
            isChecked={isChecked(item.id)}
            onToggle={() => toggleOne(item.id)}
          />
        ))}
      </div>

      {/* 설비 상세 판넬 (기존 설비 조회) */}
      {selectedEquipment && (
        <FacilityDetailPanel
          facility={selectedEquipment}
          onClose={handlePanelClose}
          onSuccess={refetchEquipment}
        />
      )}

      {/* 설비 생성 판넬 (빈 데이터) */}
      {isCreatePanelOpen && (
        <FacilityDetailPanel onClose={handleCreatePanelClose} onSuccess={refetchEquipment} />
      )}
    </>
  )
}

export default Facility
