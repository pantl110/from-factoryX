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
import {
  MaterialItemModel,
  ProductListResponseModel,
} from '@/types/data-model';
import DeleteModal from '@/ui/modal/delete-modal';
import ProductDetailPanel from '@/app/(with-layout)/stock/product/product-detail';
import StockLocationModal from '../../modals/stock-location-modal';
import { MaterialPackagingDetailModal } from '../modals/material-packaging-detail-modal';
import CreateSubstituteModal from '../modals/create-substitute-modal';
import { useDeleteSubstituteMutation } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';

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
  const [packagingModalMode, setPackagingModalMode] = useState<
    'create' | 'update'
  >('create');

  // 모달 열기 함수 (mode 포함)
  const handleOpenPackagingModal = (mode: 'create' | 'update') => {
    setPackagingModalMode(mode);
    setIsMaterialPackagingDetailModalOpen(true);
  };

  // ClientDetailPanel 관련 상태
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [hasClientBeenModified, setHasClientBeenModified] = useState(false);

  // 제품 코드 중복 검사를 위한 상태
  const [existingProductCodes, setExistingProductCodes] = useState<string[]>(
    []
  );

  // 삭제 모달 관련 상태 (통합)
  type DeleteType = 'connection' | 'substitute' | 'location' | null;
  const [deleteModalState, setDeleteModalState] = useState<{
    type: DeleteType;
    id: number | null;
    sourceMaterialId?: number;
    targetMaterialId?: number;
  }>({ type: null, id: null });
  const queryClient = useQueryClient();
  const deleteSubstituteMutation = useDeleteSubstituteMutation();

  // 제품 디테일 판넬 열기 관련 상태
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

  const [hasProductBeenModified, setHasProductBeenModified] = useState(false); // 제품이 실제로 수정/삭제되었는지

  // 필수값 검증 함수
  const checkRequiredFilled = (): boolean => {
    const refObj = materialDetailRef.current;
    if (!refObj) return false;

    const currentValues = refObj.getValues ? refObj.getValues() : undefined;
    return !!(
      currentValues &&
      String(currentValues.materialName || '').trim() !== '' &&
      String(currentValues.materialCode || '').trim() !== '' &&
      String(currentValues.unit || '').trim() !== '' &&
      String(currentValues.size || '').trim() !== ''
    );
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
    }

    setDeleteModalState({ type: null, id: null });
  };

  // 모든 제품 코드 가져오기
  useEffect(() => {
    const fetchAllProductCodes = async () => {
      // 첫 페이지를 가져와서 전체 개수 확인
      const firstPageResult = await getProductList({
        page: 1,
        page_size: 10,
      });

      if (firstPageResult.success && firstPageResult.data) {
        const { totalCnt } = firstPageResult.data as ProductListResponseModel;

        // 전체 개수를 알았으니 한 번에 모든 데이터 가져오기
        const allDataResult = await getProductList({
          page: 1,
          page_size: totalCnt,
        });

        if (allDataResult.success && allDataResult.data) {
          const codes = allDataResult.data.data.map((product) => product.code);
          setExistingProductCodes(codes);
        }
      }
    };
    fetchAllProductCodes();
  }, [getProductList]);

  // 중복 검사 함수
  const checkDuplicateProductCode = (
    code: string,
    selectedProducts: MaterialItemModel[] = []
  ): boolean => {
    // 기존 제품 코드들 확인
    const isExistingDuplicate = existingProductCodes.includes(code);

    // 현재 선택된 제품들 중에서도 중복 확인
    const isSelectedDuplicate = selectedProducts.some(
      (product) => product.code === code
    );

    return isExistingDuplicate || isSelectedDuplicate;
  };

  // 중복 토스트 표시 함수
  const showDuplicateProductToast = () => {
    setToastText('이미 존재하는 제품코드에요.');
    setToastSubtext('다른 제품코드로 수정해주세요');
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
      const payload: Record<string, string | number> = {};

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

      // 숫자 필드들 추가 (빈값이면 0으로 저장)
      if (values.currentStock !== undefined) {
        payload.current_stock =
          values.currentStock === '' ? 0 : Number(values.currentStock);
      }
      if (values.minStock !== undefined) {
        payload.standard_stock =
          values.minStock === '' ? 0 : Number(values.minStock);
      }

      if (Object.keys(payload).length > 0) {
        const result = await updateMaterial(selectedMaterialId, payload);
        if (!result || !result.success) {
          alert(result?.error || '원자재 정보 수정에 실패했습니다.');
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
              disabled={!checkRequiredFilled()}
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
          mode={packagingModalMode}
          onClose={() => setIsMaterialPackagingDetailModalOpen(false)}
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
