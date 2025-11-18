import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { useQuery } from '@tanstack/react-query';
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
  useUnitConversionApi,
} from '@/hooks';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import Unit from './unit';

const MasterData = () => {
  const factoryId = useMemberStore((state) => state.factoryId);
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

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

  // 단위 변환 API
  const { list: getUnitList } = useUnitConversionApi();
  const [unitCategory, setUnitCategory] = useState<string>('전체');
  const [unitPage, setUnitPage] = useState(1);

  // 디바운스된 검색어 (300ms)
  const [debouncedSearchKeyword] = useDebounce(searchKeyword, 300);

  // 단위 변환 목록 조회 (React Query)
  const itemType =
    unitCategory === '자재'
      ? 'material'
      : unitCategory === '제품'
        ? 'product'
        : 'all';

  const {
    data: unitListData,
    isLoading: isUnitLoading,
    refetch: refetchUnitList,
  } = useQuery({
    queryKey: [
      'unit-conversion',
      'list',
      factoryId,
      unitPage,
      debouncedSearchKeyword,
      itemType,
    ],
    queryFn: async () => {
      if (!factoryId) return null;
      const result = await getUnitList({
        page: unitPage,
        page_size: 10,
        q: debouncedSearchKeyword.trim() || undefined,
        item_type: itemType === 'all' ? null : itemType,
      });
      return result.success && result.data ? result.data : null;
    },
    enabled: !!factoryId && settingChip === 'unit',
  });

  const unitList = unitListData?.data || [];
  const unitPagination = unitListData
    ? {
        currentPage: unitListData.curPage || unitPage,
        totalPages: unitListData.pageCnt || 1,
      }
    : { currentPage: 1, totalPages: 1 };

  // 삭제 훅
  const { deleteEquipment, isLoading: isDeleteLoading } = useDeleteEquipment(); // 설비 삭제 훅
  const { deleteClient, isLoading: isDeleteClientLoading } = useDeleteClient(); // 거래처 삭제 훅

  // id 배열
  const equipmentIds: number[] =
    equipmentList?.data?.map((item: { id: number }) => item.id) ?? []; // 설비 id 배열
  const clientIds: number[] =
    clientList?.data?.map((item: { id: number }) => item.id) ?? []; // 거래처 id 배열

  // 통합된 검색 함수 - 디바운스된 검색어로 현재 탭에 맞는 검색 실행
  const handleSearch = useCallback(
    (keyword: string) => {
      if (settingChip === 'equipment') {
        if (keyword.trim()) {
          searchEquipment(keyword, 1);
        } else {
          getEquipmentList(1);
        }
      } else if (settingChip === 'client') {
        getClients({
          q: keyword.trim() || undefined,
          page: 1,
          page_size: 10,
        });
      } else if (settingChip === 'unit') {
        // React Query가 자동으로 refetch되므로 페이지만 초기화
        setUnitPage(1);
      }
    },
    [settingChip, searchEquipment, getEquipmentList, getClients]
  );

  // 검색어 변경 시 즉시 처리 (디바운스는 useDebounce에서 처리)
  const handleSearchChange = useCallback(
    (keyword: string) => {
      setSearchKeyword(keyword);
      // 단위변환 탭일 때는 페이지 초기화
      if (settingChip === 'unit') {
        setUnitPage(1);
      }
    },
    [settingChip]
  );

  // 디바운스된 검색어가 변경될 때 검색 실행 (단위변환은 React Query가 자동 처리)
  useEffect(() => {
    if (settingChip !== 'unit') {
      handleSearch(debouncedSearchKeyword);
    }
  }, [debouncedSearchKeyword, handleSearch, settingChip]);

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

  // 검색과 무관한 전체 개수(칩 표시용) - 초기 로딩 시 한 번만 저장
  const [equipmentTotal, setEquipmentTotal] = useState<number | null>(null);
  const [clientTotal, setClientTotal] = useState<number | null>(null);
  const [unitTotal, setUnitTotal] = useState<number | null>(null);

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
      // 단위변환 전체 개수 가져오기 (검색어/필터 없이)
      if (unitTotal === null) {
        getUnitList({
          page: 1,
          page_size: 1,
          q: undefined,
          item_type: null,
        }).then(
          (result: { success: boolean; data?: { totalCnt?: number } }) => {
            if (result.success && result.data?.totalCnt !== undefined) {
              setUnitTotal(result.data.totalCnt);
            }
          }
        );
      }
    }
  }, [
    factoryId,
    equipmentList,
    clientList,
    refetchEquipment,
    getClients,
    unitTotal,
    getUnitList,
  ]);

  // 검색어가 없을 때 totalCnt를 저장 (단, 이미 저장된 값이 있으면 업데이트하지 않음)
  useEffect(() => {
    if (
      !searchKeyword.trim() &&
      equipmentList?.totalCnt !== undefined &&
      equipmentTotal === null
    ) {
      setEquipmentTotal(equipmentList.totalCnt ?? 0);
    }
  }, [searchKeyword, equipmentList, equipmentTotal]);

  useEffect(() => {
    if (
      !searchKeyword.trim() &&
      clientList?.totalCnt !== undefined &&
      clientTotal === null
    ) {
      setClientTotal(clientList.totalCnt ?? 0);
    }
  }, [searchKeyword, clientList, clientTotal]);

  // 탭 선택 관련
  useEffect(() => {
    if (
      !settingChip ||
      (settingChip !== 'equipment' &&
        settingChip !== 'client' &&
        settingChip !== 'unit')
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
  const handleUnitChipClick = () => {
    setSettingChip('unit' as SettingChipType);
    setUnitPage(1); // 탭 변경 시 첫 페이지로
  };

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
        // 삭제 후 현재 검색어 유지하면서 설비 목록 리프레시
        await refetchEquipment();
        // 검색어 없이 전체 개수만 갱신 (목록 상태 변경 없음)
        const totalRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/equipment?factory_id=${factoryId}&page=1&page_size=1`,
          { method: 'GET', credentials: 'include' }
        );
        if (totalRes.ok) {
          const totalJson = await totalRes.json();
          setEquipmentTotal(totalJson?.totalCnt ?? 0);
        }
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
        // 삭제 후 현재 검색어 유지하면서 리스트 리프레시
        await getClients({
          q: debouncedSearchKeyword.trim() || undefined,
          page: 1,
          page_size: 10,
        });
        // 검색어 없이 전체 개수만 갱신 (리스트 상태 변경 없음)
        const totalParams = new URLSearchParams({
          factory_id: factoryId.toString(),
          page: '1',
          page_size: '1',
        });
        const totalRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/client?${totalParams.toString()}`,
          { method: 'GET', credentials: 'include' }
        );
        if (totalRes.ok) {
          const totalJson = await totalRes.json();
          setClientTotal(totalJson?.totalCnt ?? 0);
        }
      } catch {
        alert('거래처 삭제 중 오류가 발생했습니다.');
      }
    }

    setAllChecked(false); // 삭제 확정 시에만 체크 해제
    setIsDeleteModalOpen(false);
  };

  // const handleClearAllChecked = () => {
  //   setAllChecked(false);
  // };

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
      q: debouncedSearchKeyword.trim() || undefined,
      page,
      page_size: 10,
    });
  };

  // 페이지네이션 변경 핸들러 (Unit용)
  const handleUnitPageChange = (page: number) => {
    setUnitPage(page);
  };

  // 단위 카테고리 변경 핸들러
  const handleUnitCategoryChange = useCallback((category: string) => {
    setUnitCategory(category);
    setUnitPage(1); // 카테고리 변경 시 첫 페이지로
  }, []);

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
      case 'unit':
        return (
          <Unit
            unitList={unitList}
            refetchUnit={async () => {
              await refetchUnitList();
              // 삭제 후 전체 개수 갱신
              if (factoryId) {
                const result = await getUnitList({
                  page: 1,
                  page_size: 1,
                  q: undefined,
                  item_type: null,
                });
                if (result.success && result.data?.totalCnt !== undefined) {
                  setUnitTotal(result.data.totalCnt);
                }
              }
            }}
            currentPage={unitPagination.currentPage}
            totalPages={unitPagination.totalPages}
            onPageChange={handleUnitPageChange}
            searchKeyword={searchKeyword}
            onSearchChange={handleSearchChange}
            onSearchEnter={() => handleSearch(searchKeyword)}
            isLoading={isUnitLoading}
            selectedCategory={unitCategory}
            onCategoryChange={handleUnitCategoryChange}
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
          text={`설비 관리${typeof equipmentTotal === 'number' ? ` ${equipmentTotal}` : ''}`}
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
          text={`거래처 정보${typeof clientTotal === 'number' ? ` ${clientTotal}` : ''}`}
          textColor={settingChip === 'client' ? 'text-bg' : 'text-dg'}
          bgColor={settingChip === 'client' ? 'bg-dg' : 'bg-transparent'}
          radius="rounded-full"
          borderColor="border-lg"
          cursor="cursor-pointer"
          onClick={handleClientChipClick}
          height="h-9"
          padding="px-4"
        />
        <Chip
          text={`단위 변환 관리${typeof unitTotal === 'number' ? ` ${unitTotal}` : ''}`}
          textColor={settingChip === 'unit' ? 'text-bg' : 'text-dg'}
          bgColor={settingChip === 'unit' ? 'bg-dg' : 'bg-transparent'}
          radius="rounded-full"
          borderColor="border-lg"
          cursor="cursor-pointer"
          onClick={handleUnitChipClick}
          height="h-9"
          padding="px-4"
        />
      </div>
      {settingChip === 'unit' || (
        <div className="flex items-center justify-between px-10 pb-4">
          <SearchInput
            placeholder={
              settingChip === 'client'
                ? '회사명, 대표자명, 연락처 등을 입력해 검색하세요.'
                : '설비명을 입력해 검색하세요.'
            }
            value={searchKeyword}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchKeyword);
              }
            }}
          />
          <div className="flex gap-2">
            {settingChip === 'equipment' && (
              <MiniBtn
                text="추가"
                variant="whiteOutline"
                onClick={handleAddBtnClick}
                disabled={!factoryId || isViewer || !hasSubscription()}
              />
            )}

            {/* 삭제 버튼 */}
            {!isViewer &&
              hasSubscription() &&
              ((settingChip === 'equipment' &&
                equipmentListForFacility.data.length > 0) ||
                (settingChip === 'client' &&
                  (clientList?.data?.length ?? 0) > 0)) && (
                <>
                  {/* <MiniBtn
                    text="취소"
                    variant="whiteOutline"
                    onClick={handleClearAllChecked}
                  /> */}
                  <MiniBtn
                    text={getDeleteButtonText()}
                    variant={checkedCount > 0 ? 'red' : 'whiteOutline'}
                    onClick={handleDeleteBtnClick}
                    disabled={isDeleteLoading || isDeleteClientLoading}
                  />
                </>
              )}
          </div>
        </div>
      )}

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
