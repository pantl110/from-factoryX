'use client'

import { useState } from 'react'
import { EquipmentListResponseModel, EquipmentResponseModel } from '@/types/data-model'
import FacilityTableHeader from './facility-table-header'
import FacilityTableItem from './facility-table-item'
import FacilityDetailPanel from './modals/facility-detail-panel'
import Toast from '@/ui/toast'
import { WarningCircle } from '@phosphor-icons/react'
import useToast from '@/hooks/use-toast'

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
  isCreatePanelOpen = false,
  setIsCreatePanelOpen,
  isAllChecked,
  isChecked,
  toggleAll,
  toggleOne,
  refetchEquipment,
}: FacilityProps) => {
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentResponseModel | null>(null)
  const { isToastOpen, isVisible, showToast } = useToast(2000)

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
          showWarningToast={showToast}
          facilityList={facilityList}
        />
      )}

      {/* 설비 생성 판넬 (빈 데이터) */}
      {isCreatePanelOpen && (
        <FacilityDetailPanel onClose={handleCreatePanelClose} onSuccess={refetchEquipment} showWarningToast={showToast} facilityList={facilityList} />
      )}

      {isToastOpen && (
        <Toast
          icon={<WarningCircle />}
          text="다른 설비와 자동 배정 순서가 겹쳐요."
          subtext="배정 순서를 수정해주세요."
          type="red"
          isVisible={isVisible}
        />
      )}
    </>
  )
}

export default Facility
