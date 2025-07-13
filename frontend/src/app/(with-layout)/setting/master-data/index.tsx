import { useEffect, useState } from 'react'
import usePageStatusStore from '@/store/page-status-store'
import { SettingChipType } from '@/components/top-bar/types'
import Chip from '@/ui/chip'
import SearchInput from '@/ui/search-input'
import MiniBtn from '@/ui/mini-btn'
import Facility from './facility'
import Client from './client'
import { facilityData } from '@/mocks/facility-data'
import { clientData } from '@/mocks/client-data'
import { useCheckAll } from '@/hooks/use-check-all'
import DeleteModal from '@/ui/modal/delete-modal'

const MasterData = () => {
  const { settingChip, setSettingChip } = usePageStatusStore()
  const [isEquipmentCreatePanelOpen, setIsEquipmentCreatePanelOpen] = useState(false)

  // 체크박스 상태를 상위에서 관리
  const {
    checkedCount: facilityCheckedCount,
    isAllChecked: isFacilityAllChecked,
    isChecked: isFacilityChecked,
    toggleAll: facilityToggleAll,
    toggleOne: facilityToggleOne,
    getDeleteButtonText: getFacilityDeleteButtonText,
    setAllChecked: facilitySetAllChecked,
  } = useCheckAll(facilityData.map((item) => item.id))

  const {
    checkedCount: clientCheckedCount,
    isAllChecked: isClientAllChecked,
    isChecked: isClientChecked,
    toggleAll: clientToggleAll,
    toggleOne: clientToggleOne,
    getDeleteButtonText: getClientDeleteButtonText,
    setAllChecked: clientSetAllChecked,
  } = useCheckAll(clientData.map((item) => item.id))

  // 삭제 모달 상태 관리
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // 현재 탭에 따라 상태/함수 선택
  const checkedCount = settingChip === 'equipment' ? facilityCheckedCount : clientCheckedCount
  const getDeleteButtonText =
    settingChip === 'equipment' ? getFacilityDeleteButtonText : getClientDeleteButtonText
  const setAllChecked = settingChip === 'equipment' ? facilitySetAllChecked : clientSetAllChecked

  useEffect(() => {
    if (!settingChip || (settingChip !== 'equipment' && settingChip !== 'client')) {
      setSettingChip('equipment' as SettingChipType) // 설비관리 칩을 기본으로 설정
    }
  }, [settingChip, setSettingChip])

  const handleEquipmentChipClick = () => setSettingChip('equipment' as SettingChipType)
  const handleClientChipClick = () => setSettingChip('client' as SettingChipType)

  const handleAddBtnClick = () => {
    if (settingChip === 'equipment') {
      setIsEquipmentCreatePanelOpen(true)
    } else {
      // setIsClientModalOpen(true);
    }
  }

  // 삭제 버튼 클릭 시 모달 오픈
  const handleDeleteBtnClick = () => {
    if (checkedCount > 0) {
      setIsDeleteModalOpen(true)
    }
  }

  // 삭제 모달에서 확인 시 실제 삭제 로직 실행
  const handleDeleteConfirm = () => {
    // 실제 삭제 로직 구현 필요 (예: checkedIds에 해당하는 데이터 삭제)
    // 예시: alert(`삭제: ${checkedIds.join(", ")}`);
    setAllChecked(false) // 삭제 확정 시에만 체크 해제
    setIsDeleteModalOpen(false)
  }

  const handleClearAllChecked = () => {
    setAllChecked(false)
  }

  const renderContent = () => {
    switch (settingChip) {
      case 'equipment':
        return (
          <Facility
            isCreatePanelOpen={isEquipmentCreatePanelOpen}
            setIsCreatePanelOpen={setIsEquipmentCreatePanelOpen}
            isAllChecked={isFacilityAllChecked}
            isChecked={isFacilityChecked}
            toggleAll={facilityToggleAll}
            toggleOne={facilityToggleOne}
          />
        )
      case 'client':
        return (
          <Client
            isAllChecked={isClientAllChecked}
            isChecked={isClientChecked}
            toggleAll={clientToggleAll}
            toggleOne={clientToggleOne}
          />
        )
      default:
        return null
    }
  }

  return (
    <div>
      <div className="flex gap-1 px-10 pb-5">
        <Chip
          text="설비 관리"
          textColor={settingChip === 'equipment' ? 'text-bg' : 'text-dg'}
          bgColor={settingChip === 'equipment' ? 'bg-dg' : 'bg-transparent'}
          radius="rounded-full"
          borderColor="border-lg"
          cursor="cursor-pointer"
          onClick={handleEquipmentChipClick}
          height="h-9"
          padding="px-4"
        />
        <Chip
          text="거래처 정보"
          textColor={settingChip === 'client' ? 'text-bg' : 'text-dg'}
          bgColor={settingChip === 'client' ? 'bg-dg' : 'bg-transparent'}
          radius="rounded-full"
          borderColor="border-lg"
          cursor="cursor-pointer"
          onClick={handleClientChipClick}
          height="h-9"
          padding="px-4"
        />
      </div>
      <div className="flex items-center justify-between px-10 pb-4">
        <SearchInput
          placeholder={
            settingChip === 'client'
              ? '회사명, 대표자명, 연락처 등을 입력해 검색하세요.'
              : '검색어를 입력하세요.'
          }
        />
        <div className="flex gap-2">
          {settingChip === 'equipment' && (
            <MiniBtn
              text="추가"
              textColor="text-dg"
              borderColor="border-lg"
              hoverColor="hover:bg-lg"
              onClick={handleAddBtnClick}
            />
          )}

          {/* 삭제 버튼 */}
          <MiniBtn
            text="취소"
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            onClick={handleClearAllChecked}
          />
          <MiniBtn
            text={getDeleteButtonText()}
            textColor={checkedCount > 0 ? 'text-red' : 'text-dg'}
            borderColor={checkedCount > 0 ? 'border-none' : 'border-lg'}
            bgColor={checkedCount > 0 ? 'bg-red-8' : 'bg-wh'}
            hoverColor={checkedCount > 0 ? 'hover:bg-red-hover' : 'hover:bg-bg'}
            onClick={handleDeleteBtnClick}
          />
        </div>
      </div>
      {renderContent()}

      {isDeleteModalOpen && (
        <DeleteModal onClose={() => setIsDeleteModalOpen(false)} onDelete={handleDeleteConfirm} />
      )}
    </div>
  )
}

export default MasterData
