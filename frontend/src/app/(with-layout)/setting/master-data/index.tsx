import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import usePageStatusStore from '@/store/page-status-store';
import { SettingChipType } from '@/components/top-bar/types';
import Chip from '@/ui/chip';
import SearchInput from '@/ui/search-input';
import MiniBtn from '@/ui/mini-btn';
import Spinner from '@/ui/spinner';
import Facility from './facility';
import Client from './client';
import DeleteModal from '@/ui/modal/delete-modal';
import {
  useGetClient,
  useGetEquipment,
  useCheckAll,
  useDeleteEquipment,
  useDeleteClient,
} from '@/hooks';
import useFactoryStore from '@/store/factory-store';

const MasterData = () => {
  const { settingChip, setSettingChip } = usePageStatusStore();
  const factoryId = useFactoryStore((state) => state.factoryId);

  const [isEquipmentCreatePanelOpen, setIsEquipmentCreatePanelOpen] =
    useState(false);

  // 설비 목록 가져옴 (searchKeyword 상태를 useGetEquipment에 위임)
  const [searchKeyword, setSearchKeyword] = useState('');
  const {
    equipmentList,
    isLoading: isEquipmentLoading,
    setSearchKeyword: setEquipmentSearchKeyword,
    refetch: refetchEquipment,
  } = useGetEquipment();

  // 거래처 목록 가져옴
  const {
    clientList,
    isLoading: isClientLoading,
    searchKeyword: clientSearchKeyword,
    pageSize: clientPageSize,
    searchClients,
    getClients,
  } = useGetClient();

  // 삭제 훅
  const { deleteEquipment, isLoading: isDeleteLoading } = useDeleteEquipment(); // 설비 삭제 훅
  const { deleteClient, isLoading: isDeleteClientLoading } = useDeleteClient(); // 거래처 삭제 훅

  // id 배열
  const equipmentIds: number[] =
    equipmentList?.data?.map((item) => item.id) ?? []; // 설비 id 배열
  const clientIds: number[] = clientList?.data?.map((item) => item.id) ?? []; // 거래처 id 배열

  // 디바운싱 타이머 ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // setter 함수들을 useMemo로 메모이제이션
  const memoizedSetEquipmentSearchKeyword = useMemo(
    () => setEquipmentSearchKeyword,
    [setEquipmentSearchKeyword]
  );

  // 거래처 검색 함수
  const handleClientSearch = useMemo(
    () => (keyword: string) => {
      searchClients(keyword);
    },
    [searchClients]
  );

  // 검색어 변경 시 debounce 적용
  const handleSearchChange = useCallback(
    (keyword: string) => {
      setSearchKeyword(keyword);

      // 이전 타이머 클리어
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // 새 타이머 설정 (300ms debounce)
      const timer = setTimeout(() => {
        if (keyword.trim()) {
          searchClients(keyword);
        } else {
          getClients();
        }
      }, 300);

      debounceTimer.current = timer;
    },
    [debounceTimer, searchClients, getClients]
  );

  // 검색어 상태 동기화 (디바운싱)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (settingChip === 'equipment') {
        memoizedSetEquipmentSearchKeyword(searchKeyword);
      } else if (settingChip === 'client') {
        handleClientSearch(searchKeyword);
      }
    }, 500);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [
    searchKeyword,
    memoizedSetEquipmentSearchKeyword,
    handleClientSearch,
    settingChip,
  ]);

  // 체크박스 상태 관리
  const {
    checkedCount: facilityCheckedCount,
    isAllChecked: isFacilityAllChecked,
    isChecked: isFacilityChecked,
    toggleAll: facilityToggleAll,
    toggleOne: facilityToggleOne,
    getDeleteButtonText: getFacilityDeleteButtonText,
    setAllChecked: facilitySetAllChecked,
  } = useCheckAll(equipmentIds); // 설비 체크박스 상태 관리
  const {
    checkedCount: clientCheckedCount,
    isAllChecked: isClientAllChecked,
    isChecked: isClientChecked,
    toggleAll: clientToggleAll,
    toggleOne: clientToggleOne,
    getDeleteButtonText: getClientDeleteButtonText,
    setAllChecked: clientSetAllChecked,
  } = useCheckAll(clientIds); // 거래처 체크박스 상태 관리

  // 삭제 모달 상태 관리
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 현재 탭에 따라 상태/함수 선택
  const checkedCount =
    settingChip === 'equipment' ? facilityCheckedCount : clientCheckedCount;
  const getDeleteButtonText =
    settingChip === 'equipment'
      ? getFacilityDeleteButtonText
      : getClientDeleteButtonText;
  const setAllChecked =
    settingChip === 'equipment' ? facilitySetAllChecked : clientSetAllChecked;

  // 탭 선택 관련
  useEffect(() => {
    if (
      !settingChip ||
      (settingChip !== 'equipment' && settingChip !== 'client')
    ) {
      setSettingChip('equipment' as SettingChipType); // 설비관리 칩을 기본으로 설정
      return;
    }
  }, [settingChip, setSettingChip]);

  // 탭이 변경될 때만 검색어 초기화 (별도 useEffect)
  const [previousChip, setPreviousChip] = useState<string | null>(null);
  useEffect(() => {
    if (previousChip !== null && previousChip !== settingChip) {
      setSearchKeyword('');
    }
    setPreviousChip(settingChip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingChip]);

  const handleEquipmentChipClick = () =>
    setSettingChip('equipment' as SettingChipType);
  const handleClientChipClick = () =>
    setSettingChip('client' as SettingChipType);

  // 설비 추가
  const handleAddBtnClick = () => {
    if (settingChip === 'equipment') {
      setIsEquipmentCreatePanelOpen(true);
    }
  };

  // 삭제 버튼 클릭 시 모달 오픈
  const handleDeleteBtnClick = () => {
    if (checkedCount > 0) {
      setIsDeleteModalOpen(true);
    }
  };

  // 삭제 모달에서 확인 시 실제 삭제 로직 실행
  const handleDeleteConfirm = async () => {
    if (settingChip === 'equipment') {
      // 설비 삭제 로직
      const checkedEquipmentIds = equipmentIds.filter((id) =>
        isFacilityChecked(id)
      );
      if (checkedEquipmentIds.length === 0) {
        return;
      }
      try {
        // 선택된 모든 설비 삭제
        const deletePromises = checkedEquipmentIds.map((id) =>
          deleteEquipment(id)
        );
        await Promise.all(deletePromises);
        // 설비 목록 새로고침
        await refetchEquipment();
      } catch {
        alert('설비 삭제 중 오류가 발생했습니다.');
      }
    } else if (settingChip === 'client') {
      // 거래처 삭제 로직
      const checkedClientIds = clientIds.filter((id) => isClientChecked(id));
      if (checkedClientIds.length === 0) {
        return;
      }
      try {
        // 선택된 모든 거래처 삭제
        if (!factoryId) {
          alert('공장 정보가 없습니다. 잠시 후 다시 시도해주세요.');
          return;
        }

        const deletePromises = checkedClientIds.map((id) =>
          deleteClient({
            factory_id: factoryId,
            client_id: id,
          })
        );
        await Promise.all(deletePromises);
        // 거래처 목록 새로고침
        await getClients();
      } catch {
        alert('거래처 삭제 중 오류가 발생했습니다.');
      }
    }

    setAllChecked(false); // 삭제 확정 시에만 체크 해제
    setIsDeleteModalOpen(false);
  };

  const handleClearAllChecked = () => {
    setAllChecked(false);
  };

  // equipmentList를 Facility에 넘길 때 PaginationModel 형태로 래핑 - useMemo로 메모이제이션
  const equipmentListForFacility = useMemo(
    () => ({
      data: equipmentList?.data || [],
      count: equipmentList?.count || 0,
      totalCnt: equipmentList?.totalCnt || 0,
      pageCnt: equipmentList?.pageCnt || 1,
      curPage: equipmentList?.curPage || 1,
      nextPage: equipmentList?.nextPage || 1,
      previousPage: equipmentList?.previousPage || 1,
    }),
    [equipmentList]
  );

  // 페이지네이션 변경 핸들러 (Client용)
  const handleClientPageChange = async (page: number) => {
    await getClients({
      q: clientSearchKeyword,
      page,
      page_size: clientPageSize,
    });
  };

  const renderContent = () => {
    // 로딩 중일 때 스피너 표시
    if (
      (settingChip === 'equipment' && isEquipmentLoading) ||
      (settingChip === 'client' && isClientLoading)
    ) {
      return (
        <div className="flex justify-center items-center py-20">
          <Spinner />
        </div>
      );
    }

    switch (settingChip) {
      case 'equipment':
        return (
          <Facility
            equipmentList={equipmentListForFacility}
            isCreatePanelOpen={isEquipmentCreatePanelOpen}
            setIsCreatePanelOpen={setIsEquipmentCreatePanelOpen}
            isAllChecked={isFacilityAllChecked}
            isChecked={isFacilityChecked}
            toggleAll={facilityToggleAll}
            toggleOne={facilityToggleOne}
            refetchEquipment={refetchEquipment}
          />
        );
      case 'client':
        return (
          <Client
            isAllChecked={isClientAllChecked}
            isChecked={isClientChecked}
            toggleAll={clientToggleAll}
            toggleOne={clientToggleOne}
            clientList={clientList}
            onPageChange={handleClientPageChange}
            refetchClient={() => {
              getClients();
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-1 px-10 pb-5">
        <Chip
          text={`설비 관리 ${equipmentList?.totalCnt}`}
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
          text={`거래처 정보 ${clientList?.totalCnt}`}
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
          onChange={handleSearchChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (debounceTimer.current) clearTimeout(debounceTimer.current);
              if (settingChip === 'equipment') {
                memoizedSetEquipmentSearchKeyword(searchKeyword);
              } else if (settingChip === 'client') {
                handleClientSearch(searchKeyword);
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
            disabled={isDeleteLoading || isDeleteClientLoading}
          />
        </div>
      </div>
      {renderContent()}

      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDeleteConfirm}
          isLoading={isDeleteLoading || isDeleteClientLoading}
        />
      )}
    </div>
  );
};

export default MasterData;
