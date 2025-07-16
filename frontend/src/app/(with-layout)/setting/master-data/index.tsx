import { useEffect, useState, useRef } from 'react'
import usePageStatusStore from '@/store/page-status-store'
import { SettingChipType } from '@/components/top-bar/types'
import Chip from '@/ui/chip'
import SearchInput from '@/ui/search-input'
import MiniBtn from '@/ui/mini-btn'
import Facility from './facility'
import Client from './client'
import { useCheckAll } from '@/hooks/use-check-all'
import DeleteModal from '@/ui/modal/delete-modal'
import useGetEquipment from '@/hooks/factory-equipment/use-get-equipment'
import useDeleteEquipment from '@/hooks/factory-equipment/use-delete-equipment'
import {
  EquipmentListResponseModel,
  EquipmentResponseModel,
} from '@/types/data-model'
import { clientData } from '@/mocks/client-data'

const MasterData = () => {
  const { settingChip, setSettingChip } = usePageStatusStore()
  const [isEquipmentCreatePanelOpen, setIsEquipmentCreatePanelOpen] = useState(false)

  // 설비 목록 가져옴 (searchKeyword 상태를 useGetEquipment에 위임)
  const [searchKeyword, setSearchKeyword] = useState('')
  const {
    equipmentList,
    isLoading: isEquipmentLoading,
    error: equipmentError,
    setSearchKeyword: setEquipmentSearchKeyword,
    refetch: refetchEquipment,
  } = useGetEquipment()

  // 설비 삭제 훅
  const { deleteEquipment, isLoading: isDeleteLoading } = useDeleteEquipment()

  // 설비 id 배열
  const equipmentIds: number[] = equipmentList?.data?.map((item) => item.id) ?? []

  // client id 배열 (목데이터 기반)
  const clientIds: string[] = clientData.map((item) => item.id)

  // 디바운싱 타이머 ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // 검색어 상태 동기화 (디바운싱)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      if (settingChip === 'equipment') {
        setEquipmentSearchKeyword(searchKeyword)
      } else if (settingChip === 'client') {
        // setClientSearchKeyword(searchKeyword)
      }
    }, 500)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [searchKeyword, setEquipmentSearchKeyword, settingChip])

  // 체크박스 상태를 상위에서 관리
  const {
    checkedCount: facilityCheckedCount,
    isAllChecked: isFacilityAllChecked,
    isChecked: isFacilityChecked,
    toggleAll: facilityToggleAll,
    toggleOne: facilityToggleOne,
    getDeleteButtonText: getFacilityDeleteButtonText,
    setAllChecked: facilitySetAllChecked,
  } = useCheckAll(equipmentIds)

  const {
    checkedCount: clientCheckedCount,
    isAllChecked: isClientAllChecked,
    isChecked: isClientChecked,
    toggleAll: clientToggleAll,
    toggleOne: clientToggleOne,
    getDeleteButtonText: getClientDeleteButtonText,
    setAllChecked: clientSetAllChecked,
  } = useCheckAll(clientIds)

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

  // 설비 추가
  const handleAddBtnClick = () => {
    if (settingChip === 'equipment') {
      setIsEquipmentCreatePanelOpen(true)
    }
  }

  // 삭제 버튼 클릭 시 모달 오픈
  const handleDeleteBtnClick = () => {
    if (checkedCount > 0) {
      setIsDeleteModalOpen(true)
    }
  }

  // 삭제 모달에서 확인 시 실제 삭제 로직 실행
  const handleDeleteConfirm = async () => {
    if (settingChip === 'equipment') {
      // 설비 삭제 로직
      const checkedEquipmentIds = equipmentIds.filter((id) => isFacilityChecked(id))

      if (checkedEquipmentIds.length === 0) {
        return
      }

      try {
        // 선택된 모든 설비 삭제
        const deletePromises = checkedEquipmentIds.map((id) => deleteEquipment(id))
        await Promise.all(deletePromises)

        // 설비 목록 새로고침
        await refetchEquipment()
      } catch {
        alert('설비 삭제 중 오류가 발생했습니다.')
      }
    }

    setAllChecked(false) // 삭제 확정 시에만 체크 해제
    setIsDeleteModalOpen(false)
  }

  const handleClearAllChecked = () => {
    setAllChecked(false)
  }

  // equipmentList를 Facility에 넘길 때 PaginationModel 형태로 래핑
  const equipmentListForFacility = {
    data: equipmentList?.data || [],
    count: equipmentList?.count || 0,
    totalCnt: equipmentList?.totalCnt || 0,
    pageCnt: equipmentList?.pageCnt || 1,
    curPage: equipmentList?.curPage || 1,
    nextPage: equipmentList?.nextPage || 1,
    previousPage: equipmentList?.previousPage || 1,
  }

  const renderContent = () => {
    switch (settingChip) {
      case 'equipment':
        return (
          <Facility
            equipmentList={equipmentListForFacility}
            isLoading={isEquipmentLoading}
            error={equipmentError}
            isCreatePanelOpen={isEquipmentCreatePanelOpen}
            setIsCreatePanelOpen={setIsEquipmentCreatePanelOpen}
            isAllChecked={isFacilityAllChecked}
            isChecked={isFacilityChecked}
            toggleAll={facilityToggleAll}
            toggleOne={facilityToggleOne}
            refetchEquipment={refetchEquipment}
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
          value={searchKeyword}
          onChange={setSearchKeyword}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (debounceTimer.current) clearTimeout(debounceTimer.current)
              if (settingChip === 'equipment') {
                setEquipmentSearchKeyword(searchKeyword)
              } else if (settingChip === 'client') {
                // setClientSearchKeyword(searchKeyword)
              }
            }
          }}
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
            disabled={isDeleteLoading}
          />
        </div>
      </div>
      {renderContent()}

      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDeleteConfirm}
          isLoading={isDeleteLoading}
        />
      )}
    </div>
  )
}

export default MasterData
