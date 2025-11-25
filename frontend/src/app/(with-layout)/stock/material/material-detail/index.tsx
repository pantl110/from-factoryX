import Panel from '@/ui/panel';
import React, { useEffect, useRef, useState } from 'react';
import MaterialDetail, { MaterialInfoModel } from './material-detail';
import MiniBtn from '@/ui/mini-btn';
import {
  useLocation,
  useUpdateMaterial,
  useGetProduct,
  useUploadFile,
  useToast,
  useMaterialProduct,
} from '@/hooks';
import { useMaterialReloadStore } from '@/store/material-reload-store';
import ProductEnrollmentModal from '../modals/product-enrollment-modal';
// import StockLocationUploadModal from '../../modals/stock-location-upload-modal';
import ClientDetailPanel from '@/app/(with-layout)/setting/master-data/client/modals/client-detail-panel';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { MaterialItemModel } from '@/types/data-model';
import DeleteModal from '@/ui/modal/delete-modal';
import ProductDetailPanel from '@/app/(with-layout)/stock/product/product-detail';
import StockLocationModal from '../../modals/stock-location-modal';
import { MaterialPackagingDetailModal } from '../modals/material-packaging-detail-modal';
import CreateSubstituteModal from '../modals/create-substitute-modal';
import {
  useDeleteSubstituteMutation,
  useDeleteMaterialRepackaging,
} from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';

interface LocationModel {
  id: number;
  type?: 'material' | 'product';
  location: string;
  images: (string | File)[];
}

interface MaterialDetailRefModel extends MaterialInfoModel {
  isLocationDirty?: boolean;
  getLocationValues?: () => LocationModel[];
  resetLocations?: (locations: LocationModel[]) => void;
  watch?: (name: string) => (string | File)[] | undefined;
  setValue?: (
    name: string,
    value: (string | File)[],
    options?: { shouldDirty?: boolean }
  ) => void;
  productRequiringMaterialRef?: {
    current?: {
      refresh?: () => void;
    };
  };
  subMaterialsRef?: {
    current?: {
      resetToFirstPage?: () => void;
    };
  };
}

interface MaterialDetailPanelProps {
  setIsMaterialDetailOpen: (isOpen: boolean) => void;
  selectedMaterialId: number;
  onSuccess?: () => void;
}
const MaterialDetailPanel = ({
  setIsMaterialDetailOpen,
  selectedMaterialId,
  onSuccess,
}: MaterialDetailPanelProps) => {
  const [isMaterialDetailDirty, setIsMaterialDetailDirty] = useState(false); // 원자재 디테일 판넬 수정 상태
  const [hasRequiredFieldsFilled, setHasRequiredFieldsFilled] = useState(true); // 필수 필드 채워짐 상태
  const [isProductEnrollmentModalOpen, setIsProductEnrollmentModalOpen] =
    useState(false);
  const [isCreateSubstituteModalOpen, setIsCreateSubstituteModalOpen] =
    useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationModel | null>(null);
  const [
    isMaterialPackagingDetailModalOpen,
    setIsMaterialPackagingDetailModalOpen,
  ] = useState(false);
  const [selectedRepackagingId, setSelectedRepackagingId] = useState<
    number | null
  >(null);
  const [
    selectedNextRepackagingLotNumber,
    setSelectedNextRepackagingLotNumber,
  ] = useState<string | null>(null);
  const [selectedParentHistoryId, setSelectedParentHistoryId] = useState<
    number | null
  >(null);

  // 모달 열기 함수
  const handleOpenPackagingModal = (
    repackagingId?: number,
    nextRepackagingLotNumber?: string,
    parentHistoryId?: number
  ) => {
    setSelectedRepackagingId(repackagingId ?? null);
    setSelectedNextRepackagingLotNumber(nextRepackagingLotNumber ?? null);
    setSelectedParentHistoryId(parentHistoryId ?? null);
    setIsMaterialPackagingDetailModalOpen(true);
  };

  // ClientDetailPanel 관련 상태
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [hasClientBeenModified, setHasClientBeenModified] = useState(false);

  // 삭제 모달 관련 상태 (통합)
  type DeleteType =
    | 'connection'
    | 'substitute'
    | 'location'
    | 'repackaging'
    | null;
  const [deleteModalState, setDeleteModalState] = useState<{
    type: DeleteType;
    id: number | null;
    sourceMaterialId?: number;
    targetMaterialId?: number;
  }>({ type: null, id: null });
  const queryClient = useQueryClient();
  const deleteSubstituteMutation = useDeleteSubstituteMutation();
  const deleteRepackagingMutation = useDeleteMaterialRepackaging();

  // 제품 디테일 판넬 열기 관련 상태
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

  const [hasProductBeenModified, setHasProductBeenModified] = useState(false); // 제품이 실제로 수정/삭제되었는지

  // 필수값 검증 함수
  const checkRequiredFilled = (): boolean => {
    return hasRequiredFieldsFilled;
  };

  // ClientDetailPanel 열기 함수
  const setIsClinetDetailPanelOpen = (clientId: number) => {
    setSelectedClientId(clientId);
  };

  const {
    createLocation,
    updateLocation,
    deleteLocation,
    listLocations,
    isLoading: isLocationLoading,
  } = useLocation();
  const { uploadMultipleFiles } = useUploadFile();
  const { getProductList } = useGetProduct();
  const { deleteMaterialProductConnection } = useMaterialProduct();
  const { isToastOpen, isVisible, showToast } = useToast();
  const [toastText, setToastText] = useState('');
  const [toastSubtext, setToastSubtext] = useState('');
  const [prevLocations, setPrevLocations] = useState<LocationModel[]>([]);
  const handleRequestDeleteLocation = (index: number, locationId?: number) => {
    if (typeof locationId === 'number') {
      setDeleteModalState({ type: 'location', id: locationId });
    }
  };

  // 삭제 모달 열기 함수
  const handleOpenDeleteModal = (connectionId: number) => {
    setDeleteModalState({ type: 'connection', id: connectionId });
  };

  // 대체 자재 삭제 모달 열기 함수
  const handleOpenDeleteSubstituteModal = (
    sourceMaterialId: number,
    targetMaterialId: number
  ) => {
    setDeleteModalState({
      type: 'substitute',
      id: null, // substitute 타입에서는 id를 사용하지 않음
      sourceMaterialId,
      targetMaterialId,
    });
  };

  // 통합 삭제 확인 함수
  const handleConfirmDelete = async () => {
    const { type, id } = deleteModalState;
    if (!type) return;

    // substitute 타입이 아닌 경우 id 체크
    if (type !== 'substitute' && (id === null || id === undefined)) return;

    switch (type) {
      case 'connection':
        if (id === null || id === undefined) return;
        try {
          const result = await deleteMaterialProductConnection(id);
          if (result.success) {
            setHasProductBeenModified(true);
          }
        } catch {
          // 삭제 실패 시 에러 처리
        }
        break;
      case 'substitute': {
        const { sourceMaterialId, targetMaterialId } = deleteModalState;
        if (sourceMaterialId && targetMaterialId) {
          deleteSubstituteMutation.mutate(
            {
              sourceMaterialId,
              targetMaterialId,
            },
            {
              onSuccess: () => {
                // 삭제 성공 시 해당 source_material의 대체 자재 관계 목록을 다시 불러옴
                queryClient.invalidateQueries({
                  queryKey: ['substitute', 'by-material', sourceMaterialId],
                });
              },
              onError: () => {
                // 삭제 실패 시 에러 처리
              },
            }
          );
        }
        break;
      }
      case 'location':
        if (id === null || id === undefined) return;
        try {
          await deleteLocation(id, 'material');
          if (selectedMaterialId) {
            const res = await listLocations('material', selectedMaterialId);
            if (
              res &&
              res.success &&
              res.data &&
              Array.isArray(res.data.locations)
            ) {
              setPrevLocations(res.data.locations);
              materialDetailRef.current?.resetLocations?.(res.data.locations);
            }
          }
        } catch {
          // 삭제 실패 시 에러 처리
        }
        break;
      case 'repackaging':
        if (id === null || id === undefined) return;
        deleteRepackagingMutation.mutate(id, {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ['material-repackagings'],
            });
            queryClient.invalidateQueries({
              queryKey: ['material-history'],
            });
            void handleRepackagingUpdateSuccess();
          },
          onError: (error) => {
            const errorMessage =
              error instanceof Error
                ? error.message
                : '소분 내역 삭제에 실패했어요.';
            setToastText(errorMessage);
            setToastSubtext('');
            showToast();
          },
        });
        break;
    }

    setDeleteModalState({ type: null, id: null });
  };

  // 중복 검사 함수 (비동기 - 제품 코드로 검색)
  const checkDuplicateProductCode = async (
    code: string,
    selectedProducts: MaterialItemModel[] = []
  ): Promise<boolean> => {
    // 현재 선택된 제품들 중에서 중복 확인
    const isSelectedDuplicate = selectedProducts.some(
      (product) => product.code === code
    );

    if (isSelectedDuplicate) {
      return true;
    }

    // 제품 코드로 검색하여 존재하는지 확인
    if (!code || code.trim() === '') {
      return false;
    }

    try {
      const result = await getProductList({
        q: code,
        page: 1,
        page_size: 10,
      });

      if (result.success && result.data) {
        // 검색 결과에서 정확히 일치하는 코드가 있는지 확인
        const hasExactMatch = result.data.data.some(
          (product) => product.code === code
        );
        return hasExactMatch;
      }
    } catch {
      // 에러 발생 시 중복이 아닌 것으로 처리
      return false;
    }

    return false;
  };

  // 중복 토스트 표시 함수
  const showDuplicateProductToast = () => {
    setToastText('이미 존재하는 제품코드에요.');
    setToastSubtext('다른 제품코드로 수정해주세요.');
    showToast();
  };

  // 원자재 디테일 열릴 때 기존 위치 목록 불러오기
  useEffect(() => {
    const fetchLocations = async () => {
      if (selectedMaterialId) {
        const res = await listLocations('material', selectedMaterialId);
        if (
          res &&
          res.success &&
          res.data &&
          Array.isArray(res.data.locations)
        ) {
          setPrevLocations(res.data.locations);
        } else {
          setPrevLocations([]);
        }
      }
    };
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMaterialId]);

  // 원자재 디테일 판넬의 저장 버튼 클릭 시 수정사항 반영
  const materialDetailRef = useRef<MaterialDetailRefModel>(null);
  const { updateMaterial } = useUpdateMaterial();
  const { setShouldReload } = useMaterialReloadStore();
  const factoryId = useMemberStore((state) => state.factoryId);

  const handleRepackagingUpdateSuccess = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['material-history'],
    });

    if (factoryId && selectedMaterialId) {
      await queryClient.invalidateQueries({
        queryKey: ['material-detail', factoryId, selectedMaterialId],
      });
    }

    if (materialDetailRef.current?.refetchMaterialInfo) {
      await materialDetailRef.current.refetchMaterialInfo();
    }
  };

  // 필수 필드 검증 상태 업데이트 (간단하게)
  const handleRequiredFieldsChange = (areFilled: boolean) => {
    setHasRequiredFieldsFilled(areFilled);
  };
  const handleSaveMaterialDetail = async () => {
    if (!selectedMaterialId) return;
    const refObj = materialDetailRef.current;
    if (!refObj) return;

    // 필수값 검증: 저장 전에 현재 값 확인
    if (!checkRequiredFilled()) {
      return;
    }

    let hasSaved = false;

    // 1. 원자재 정보 저장
    if (refObj.isDirty) {
      const values = refObj.getValues();
      const payload: Record<string, string | number | null> = {};

      // 필수 필드들 추가
      if (values.materialName !== undefined && values.materialName !== '') {
        payload.name = values.materialName;
      }
      if (values.materialCode !== undefined && values.materialCode !== '') {
        payload.code = values.materialCode;
      }
      if (values.size !== undefined && values.size !== '') {
        payload.spec = values.size;
      }
      if (values.unit !== undefined && values.unit !== '') {
        payload.unit = values.unit;
      }

      // 숫자 필드들 추가 (빈값이면 null로 저장)
      if (values.currentStock !== undefined) {
        payload.current_stock =
          values.currentStock === '' ? null : Number(values.currentStock);
      }
      if (values.standardStock !== undefined) {
        payload.standard_stock =
          values.standardStock === '' ? null : Number(values.standardStock);
      }
      if (values.rop !== undefined) {
        payload.rop = values.rop === '' ? null : Number(values.rop);
      }
      // 필수값이 아닌 필드들: 빈값이면 null로 저장
      if (values.maxStock !== undefined) {
        payload.max_stock =
          values.maxStock === '' ? null : Number(values.maxStock);
      }
      if (values.expiryDays !== undefined) {
        payload.expiry_days =
          values.expiryDays === '' ? null : values.expiryDays;
      }
      if (values.memo !== undefined) {
        payload.memo = values.memo === '' ? null : values.memo;
      }

      // max stock > rop > standard stock 검증 (있는 값들 간의 관계만 검증)
      const maxStockNum =
        values.maxStock !== undefined && values.maxStock !== ''
          ? Number(values.maxStock)
          : null;
      const ropNum =
        values.rop !== undefined && values.rop !== ''
          ? Number(values.rop)
          : null;
      const standardStockNum =
        values.standardStock !== undefined && values.standardStock !== ''
          ? Number(values.standardStock)
          : null;

      // 있는 값들 간의 관계 검증
      if (maxStockNum !== null && ropNum !== null) {
        if (maxStockNum <= ropNum) {
          setToastText('수치를 다시 입력해주세요.');
          setToastSubtext('적정 재고는 ROP보다 항상 크게 설정해야 해요.');
          showToast();
          return;
        }
      }
      if (ropNum !== null && standardStockNum !== null) {
        if (ropNum <= standardStockNum) {
          setToastText('수치를 다시 입력해주세요.');
          setToastSubtext('ROP는 안전 재고보다 항상 크게 설정해야 해요.');
          showToast();
          return;
        }
      }
      if (
        maxStockNum !== null &&
        standardStockNum !== null &&
        ropNum === null
      ) {
        if (maxStockNum <= standardStockNum) {
          setToastText('수치를 다시 입력해주세요.');
          setToastSubtext('적정 재고는 안전 재고보다 항상 크게 설정해야 해요.');
          showToast();
          return;
        }
      }

      if (Object.keys(payload).length > 0) {
        const result = await updateMaterial(selectedMaterialId, payload);
        if (!result || !result.success) {
          const errorMessage =
            result?.error || '원자재 정보 수정에 실패했어요.';
          // 자재코드 중복 에러인 경우 워딩 통일 및 subtext 추가
          if (errorMessage.includes('이미 존재하는 자재코드')) {
            setToastText('이미 존재하는 자재코드에요.');
            setToastSubtext('다른 자재코드로 수정해주세요.');
          } else {
            setToastText(errorMessage);
            setToastSubtext('');
          }
          showToast();
          return;
        }
        hasSaved = true;
      }
    }

    // 2. 위치 정보 저장
    if (refObj.isLocationDirty) {
      const locations = refObj.getLocationValues?.() || [];
      // 2-1. 삭제: prevLocations에만 있고, locations에는 없는 location은 삭제
      for (const prevLoc of prevLocations) {
        if (!locations.some((loc: LocationModel) => loc.id === prevLoc.id)) {
          await deleteLocation(prevLoc.id, 'material');
        }
      }
      // 2-2. 생성/수정
      for (const loc of locations) {
        // File 객체와 string URL 분리
        const fileImages = (loc.images ?? []).filter(
          (img: string | File) => img instanceof File
        ) as File[];
        const urlImages = (loc.images ?? []).filter(
          (img: string | File) => typeof img === 'string'
        ) as string[];

        // File 객체가 있으면 S3에 업로드
        let uploadedUrls: string[] = [];
        if (fileImages.length > 0) {
          const uploadResults = await uploadMultipleFiles(fileImages);
          uploadedUrls = uploadResults
            .filter((result) => result.success && result.object_url)
            .map((result) => result.object_url || '');
        }

        // 기존 URL과 새로 업로드된 URL 합치기
        const images = [...urlImages, ...uploadedUrls];

        if (loc.id) {
          // PATCH
          await updateLocation(loc.id, {
            type: 'material',
            location: loc.location,
            images,
          });
        } else {
          // POST
          await createLocation({
            type: 'material',
            id: selectedMaterialId,
            location: loc.location,
            images,
          });
        }
      }
      // 저장 후 최신 위치 목록으로 form 리셋
      const res = await listLocations('material', selectedMaterialId);
      if (res && res.success && res.data && Array.isArray(res.data.locations)) {
        materialDetailRef.current?.resetLocations?.(res.data.locations);
      }
      hasSaved = true;
    }

    if (hasSaved) {
      // 캐시 무효화하여 다음에 열 때 최신 데이터를 가져오도록 함
      if (factoryId && selectedMaterialId) {
        queryClient.invalidateQueries({
          queryKey: ['material-detail', factoryId, selectedMaterialId],
        });
      }
      setShouldReload(true); // 원자재 목록 렌더링
      onSuccess?.(); // 상위에 저장 성공 알림
      setIsMaterialDetailOpen(false); // 판넬 닫기
    }
  };

  return (
    <>
      <Panel
        title="원자재 재고관리"
        onClose={() => setIsMaterialDetailOpen(false)}
        headerButton={
          isMaterialDetailDirty && (
            <MiniBtn
              text="저장"
              onClick={handleSaveMaterialDetail}
              hoverColor="hover:bg-secondary-hover"
              textColor="text-primary"
              bgColor="bg-primary-8"
              disabled={!hasRequiredFieldsFilled}
            />
          )
        }
      >
        <MaterialDetail
          ref={materialDetailRef}
          materialId={selectedMaterialId}
          locations={prevLocations}
          setIsProductEnrollmentModalOpen={setIsProductEnrollmentModalOpen}
          setIsUploadModalOpen={setIsUploadModalOpen}
          onLocationClick={(locationId) => {
            const location = prevLocations.find((loc) => loc.id === locationId);
            if (location) {
              setSelectedLocation({
                ...location,
                type: 'material' as const,
                images: (location.images || []).filter(
                  (img): img is string => typeof img === 'string'
                ),
              });
              setIsUploadModalOpen(true);
            }
          }}
          onIsDirtyChange={setIsMaterialDetailDirty}
          onRequiredFieldsChange={handleRequiredFieldsChange}
          setIsClinetDetailPanelOpen={setIsClinetDetailPanelOpen}
          handleOpenDeleteModal={handleOpenDeleteModal}
          onDeleteLocation={handleRequestDeleteLocation}
          onProductClick={(productId) => {
            setSelectedProductId(productId);
          }}
          clientWasModified={hasClientBeenModified}
          productWasModified={hasProductBeenModified}
          isLocationLoading={isLocationLoading}
          setIsMaterialPackagingDetailModalOpen={handleOpenPackagingModal}
          setIsCreateSubstituteModalOpen={setIsCreateSubstituteModalOpen}
          handleOpenDeleteSubstituteModal={handleOpenDeleteSubstituteModal}
          handleOpenDeleteRepackagingModal={(repackagingId: number) =>
            setDeleteModalState({ type: 'repackaging', id: repackagingId })
          }
        />
      </Panel>

      {/* 토스트 */}
      {isToastOpen && (
        <Toast
          text={toastText}
          subtext={toastSubtext}
          icon={<WarningCircle size={20} className="text-red" />}
          type="red"
          isVisible={isVisible}
        />
      )}

      {/* MaterialDetail의 추가하기 버튼 모달 */}
      {isProductEnrollmentModalOpen && (
        <ProductEnrollmentModal
          materialId={selectedMaterialId}
          onClose={() => setIsProductEnrollmentModalOpen(false)}
          onSuccess={() => {
            setHasProductBeenModified(true);
          }}
          checkDuplicateProductCode={checkDuplicateProductCode}
          showDuplicateProductToast={showDuplicateProductToast}
          showToast={(text: string, subtext: string) => {
            setToastText(text);
            setToastSubtext(subtext);
            showToast();
          }}
        />
      )}
      {/* 창고 추가/수정 모달 */}
      {isUploadModalOpen && (
        <StockLocationModal
          mode={selectedLocation ? 'update' : 'add'}
          selectedLocation={
            selectedLocation
              ? {
                  ...selectedLocation,
                  type: 'material' as const,
                  images: (selectedLocation.images || []).filter(
                    (img): img is string => typeof img === 'string'
                  ),
                }
              : undefined
          }
          materialId={selectedMaterialId}
          onClose={() => {
            setIsUploadModalOpen(false);
            setSelectedLocation(null);
          }}
          onSuccess={async () => {
            // 저장 성공 시 창고 위치 목록 새로고침
            if (selectedMaterialId) {
              const res = await listLocations('material', selectedMaterialId);
              if (
                res &&
                res.success &&
                res.data &&
                Array.isArray(res.data.locations)
              ) {
                setPrevLocations(res.data.locations);
                materialDetailRef.current?.resetLocations?.(res.data.locations);
              }
            }
          }}
        />
      )}
      {/* 통합 삭제 모달 */}
      {deleteModalState.type !== null && (
        <DeleteModal
          onClose={() => setDeleteModalState({ type: null, id: null })}
          onDelete={handleConfirmDelete}
        />
      )}
      {/* 원자재 소분내역 디테일 모달 */}
      {isMaterialPackagingDetailModalOpen && (
        <MaterialPackagingDetailModal
          repackagingId={selectedRepackagingId}
          nextRepackagingLotNumber={selectedNextRepackagingLotNumber}
          parentHistoryId={selectedParentHistoryId}
          onRepackagingUpdated={handleRepackagingUpdateSuccess}
          onClose={() => {
            setIsMaterialPackagingDetailModalOpen(false);
            setSelectedRepackagingId(null);
            setSelectedNextRepackagingLotNumber(null);
            setSelectedParentHistoryId(null);
          }}
        />
      )}

      {/* 연결된 제품 클릭 시 제품 디테일 판넬 열기 */}
      {selectedProductId && (
        <ProductDetailPanel
          onClose={() => {
            setSelectedProductId(null);
            // 잠시 후 수정 상태 리셋
            setTimeout(() => setHasProductBeenModified(false), 100);
          }}
          onSuccess={() => {
            // 제품이 성공적으로 저장되었을 때
            setHasProductBeenModified(true);
          }}
          productId={selectedProductId}
        />
      )}
      {/* MaterialDetail의 거래처 정보 디테일 판넬 */}
      {selectedClientId && (
        <ClientDetailPanel
          onClose={() => {
            setSelectedClientId(null);
            // 패널이 닫힐 때 수정 상태 리셋 (잠시 후에)
            setTimeout(() => setHasClientBeenModified(false), 100);
          }}
          refetchClient={() => {
            // 저장 버튼을 눌렀을 때 (수정이 발생했을 때) 호출됨
            setHasClientBeenModified(true);
          }}
          clientId={selectedClientId}
        />
      )}
      {/* 대체 자재 등록 모달 */}
      {isCreateSubstituteModalOpen && (
        <CreateSubstituteModal
          materialId={selectedMaterialId}
          onClose={() => setIsCreateSubstituteModalOpen(false)}
          onSuccess={() => {
            // 대체자재 생성 성공 시 SubMaterials 컴포넌트를 1페이지로 리셋
            if (
              materialDetailRef.current?.subMaterialsRef?.current
                ?.resetToFirstPage
            ) {
              materialDetailRef.current.subMaterialsRef.current.resetToFirstPage();
            }
          }}
        />
      )}
    </>
  );
};

export default MaterialDetailPanel;
