import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
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
import useMemberStore from '@/store/member-store';

const MasterData = () => {
  const factoryId = useMemberStore((state) => state.factoryId);
  const role = useMemberStore((state) => state.role);

  const [isEquipmentCreatePanelOpen, setIsEquipmentCreatePanelOpen] =
    useState(false);

  const { settingChip, setSettingChip } = usePageStatusStore();
  // 설비 목록 가져옴 (searchKeyword 상태를 useGetEquipment에 위임)
  const [searchKeyword, setSearchKeyword] = useState('');
  const {
    equipmentList,
    isLoading: isEquipmentLoading,
    refetch: refetchEquipment,
    changePage: changeEquipmentPage,
    searchAllFields: searchEquipment,
    getEquipmentList,
  } = useGetEquipment();

  // 거래처 목록 가져옴
  const { clientList, isLoading: isClientLoading, getClients } = useGetClient();

  // 현재 거래처 검색어 상태 추가
  const [currentClientSearchKeyword, setCurrentClientSearchKeyword] =
    useState('');

  // 디바운스된 검색어 (300ms)
  const [debouncedSearchKeyword] = useDebounce(searchKeyword, 300);

  // 삭제 훅
  const { deleteEquipment, isLoading: isDeleteLoading } = useDeleteEquipment(); // 설비 삭제 훅
  const { deleteClient, isLoading: isDeleteClientLoading } = useDeleteClient(); // 거래처 삭제 훅

  // id 배열
  const equipmentIds: number[] =
    equipmentList?.data?.map((item: { id: number }) => item.id) ?? []; // 설비 id 배열
  const clientIds: number[] =
    clientList?.data?.map((item: { id: number }) => item.id) ?? []; // 거래처 id 배열

  // 설비 검색 함수
  const handleEquipmentSearch = useMemo(
    () => (keyword: string) => {
      if (keyword.trim()) {
        searchEquipment(keyword, 1);
      } else {
        getEquipmentList(1);
      }
    },
    [searchEquipment, getEquipmentList]
  );

  // 거래처 검색 함수
  const handleClientSearch = useMemo(
    () => (keyword: string) => {
      setCurrentClientSearchKeyword(keyword);
      getClients({
        q: keyword,
        page: 1,
        page_size: 10,
      });
    },
    [getClients]
  );

  // 검색어 변경 시 즉시 처리 (디바운스는 useDebounce에서 처리)
  const handleSearchChange = useCallback((keyword: string) => {
    setSearchKeyword(keyword);
  }, []);

  // 디바운스된 검색어가 변경될 때 검색 실행
  useEffect(() => {
    if (settingChip === 'equipment') {
      handleEquipmentSearch(debouncedSearchKeyword);
    } else if (settingChip === 'client') {
      if (debouncedSearchKeyword.trim()) {
        setCurrentClientSearchKeyword(debouncedSearchKeyword);
        getClients({
          q: debouncedSearchKeyword,
          page: 1,
          page_size: 10,
        });
      } else {
        setCurrentClientSearchKeyword('');
        getClients();
      }
    }
  }, [debouncedSearchKeyword, settingChip, handleEquipmentSearch, getClients]);

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

  // 페이지 로드 시 설비와 거래처 데이터 초기 로딩
  useEffect(() => {
    if (factoryId) {
      // 설비 데이터 로딩
      if (!equipmentList) {
        refetchEquipment();
      }
      // 거래처 데이터 로딩
      if (!clientList) {
        getClients();
      }
    }
  }, [factoryId, equipmentList, clientList, refetchEquipment, getClients]);

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
      setCurrentClientSearchKeyword('');
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
      q: currentClientSearchKeyword,
      page,
      page_size: 10,
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
            // 페이지네이션 관련
            currentPage={equipmentListForFacility.curPage || 1}
            totalPages={equipmentListForFacility.pageCnt || 1}
            onPageChange={changeEquipmentPage}
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
          text={`설비 관리${equipmentList?.totalCnt ? ` ${equipmentList.totalCnt}` : ''}`}
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
          text={`거래처 정보${clientList?.totalCnt ? ` ${clientList.totalCnt}` : ''}`}
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
              : '찾고 싶은 설비명을 입력하세요.'
          }
          value={searchKeyword}
          onChange={handleSearchChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (settingChip === 'equipment') {
                handleEquipmentSearch(searchKeyword);
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
              disabled={!factoryId || role === 'viewer'}
            />
          )}

          {/* 삭제 버튼 */}
          {((settingChip === 'equipment' &&
            equipmentListForFacility.data.length > 0) ||
            (settingChip === 'client' &&
              (clientList?.data?.length ?? 0) > 0)) && (
            <>
              <MiniBtn
                text="취소"
                variant="whiteOutline"
                onClick={handleClearAllChecked}
                disabled={role === 'viewer'}
              />
              <MiniBtn
                text={getDeleteButtonText()}
                variant={checkedCount > 0 ? 'red' : 'whiteOutline'}
                onClick={handleDeleteBtnClick}
                disabled={
                  isDeleteLoading || isDeleteClientLoading || role === 'viewer'
                }
              />
            </>
          )}
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
