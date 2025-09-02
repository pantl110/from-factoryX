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
import StockLocationUploadModal from '../../modals/stock-location-upload-modal';
import ClientDetailPanel from '@/app/(with-layout)/setting/master-data/client/modals/client-detail-panel';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr';
import {
  MaterialItemModel,
  ProductListResponseModel,
} from '@/types/data-model';
import DeleteModal from '@/ui/modal/delete-modal';
import ProductDetailPanel from '@/app/(with-layout)/stock/product/product-detail';

interface LocationModel {
  id: number;
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
}

interface MaterialDetailPanelProps {
  setIsMaterialDetailOpen: (isOpen: boolean) => void;
  selectedMaterialId: number;
}
const MaterialDetailPanel = ({
  setIsMaterialDetailOpen,
  selectedMaterialId,
}: MaterialDetailPanelProps) => {
  const [isMaterialDetailDirty, setIsMaterialDetailDirty] = useState(false); // 원자재 디테일 판넬 수정 상태
  const [isProductEnrollmentModalOpen, setIsProductEnrollmentModalOpen] =
    useState(false);
  const [openUploadModals, setOpenUploadModals] = useState<boolean[]>([false]);

  // ClientDetailPanel 관련 상태
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  // 품목 코드 중복 검사를 위한 상태
  const [existingProductCodes, setExistingProductCodes] = useState<string[]>(
    []
  );

  // 삭제 모달 관련 상태
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConnectionId, setDeleteConnectionId] = useState<number | null>(
    null
  );

  // 품목 디테일 판넬 열기 관련 상태
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

  // MaterialDetail 컴포넌트 리마운트를 위한 key 상태
  const [materialDetailKey, setMaterialDetailKey] = useState(0);
  const [isRequiredFilled, setIsRequiredFilled] = useState(false); // material Detail 필수값 충족 여부

  // 품목 디테일 패널이 닫힐 때 원자재 데이터 새로고침
  const handleProductDetailClose = () => {
    setSelectedProductId(null);

    // MaterialDetail 컴포넌트를 리마운트하여 모든 데이터 새로고침
    setMaterialDetailKey((prev) => prev + 1);
  };

  // ClientDetailPanel 열기 함수
  const setIsClinetDetailPanelOpen = (clientId: number) => {
    setSelectedClientId(clientId);
  };

  const { createLocation, updateLocation, deleteLocation, listLocations } =
    useLocation();
  const { uploadMultipleFiles } = useUploadFile();
  const { getProductList } = useGetProduct();
  const { isToastOpen, isVisible, showToast } = useToast(3000);
  const { deleteMaterialProductConnection } = useMaterialProduct();
  const [prevLocations, setPrevLocations] = useState<LocationModel[]>([]);

  // 삭제 모달 열기 함수
  const handleOpenDeleteModal = (connectionId: number) => {
    setDeleteConnectionId(connectionId);
    setIsDeleteModalOpen(true);
  };

  // 삭제 확인 함수
  const handleConfirmDelete = async () => {
    if (deleteConnectionId) {
      try {
        const result =
          await deleteMaterialProductConnection(deleteConnectionId);
        if (result.success) {
          // MaterialDetail의 productRequiringMaterialRef를 통해 refresh 호출
          const materialDetailRefObj = materialDetailRef.current;
          if (
            materialDetailRefObj?.productRequiringMaterialRef?.current?.refresh
          ) {
            materialDetailRefObj.productRequiringMaterialRef.current.refresh();
          }
        }
      } catch {
        // 삭제 실패 시 에러 처리
      }
    }
    setIsDeleteModalOpen(false);
    setDeleteConnectionId(null);
  };

  // 모든 품목 코드 가져오기
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

  // 원자재 재고 위치 관련 함수
  const handleOpenUploadModal = (index: number) => {
    setOpenUploadModals((prev) => {
      // 배열을 필요한 크기로 확장
      const newModals = [...prev];
      while (newModals.length <= index) {
        newModals.push(false);
      }
      newModals[index] = true;
      return newModals;
    });
  };
  const handleCloseUploadModal = (index: number) => {
    setOpenUploadModals((prev) => {
      const newModals = [...prev];
      while (newModals.length <= index) {
        newModals.push(false);
      }
      newModals[index] = false;
      return newModals;
    });
  };

  // 원자재 디테일 판넬의 저장 버튼 클릭 시 수정사항 반영
  const materialDetailRef = useRef<MaterialDetailRefModel>(null);
  const { updateMaterial } = useUpdateMaterial();
  const { setShouldReload } = useMaterialReloadStore();
  const handleSaveMaterialDetail = async () => {
    if (!selectedMaterialId) return;
    const refObj = materialDetailRef.current;
    if (!refObj) return;

    // 필수값 검증: 저장 전에 현재 값 확인
    const currentValues = refObj.getValues ? refObj.getValues() : undefined;
    const isRequiredFilled = !!(
      currentValues &&
      String(currentValues.materialName || '').trim() !== '' &&
      String(currentValues.materialCode || '').trim() !== '' &&
      String(currentValues.unit || '').trim() !== '' &&
      String(currentValues.size || '').trim() !== ''
    );
    if (!isRequiredFilled) {
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

      // 숫자 필드들 추가
      if (values.currentStock !== undefined && values.currentStock !== '') {
        payload.current_stock = Number(values.currentStock);
      }
      if (values.minStock !== undefined && values.minStock !== '') {
        payload.standard_stock = Number(values.minStock);
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
              disabled={!isRequiredFilled}
            />
          )
        }
      >
        <MaterialDetail
          key={materialDetailKey}
          ref={materialDetailRef}
          materialId={selectedMaterialId}
          locations={prevLocations}
          setIsProductEnrollmentModalOpen={setIsProductEnrollmentModalOpen}
          handleOpenUploadModal={handleOpenUploadModal}
          onIsDirtyChange={setIsMaterialDetailDirty}
          onRequiredFilledChange={setIsRequiredFilled}
          setIsClinetDetailPanelOpen={setIsClinetDetailPanelOpen}
          handleOpenDeleteModal={handleOpenDeleteModal}
          onProductClick={(productId) => {
            setSelectedProductId(productId);
          }}
        />
      </Panel>
      {openUploadModals.map((open, idx) =>
        open ? (
          <StockLocationUploadModal
            key={idx}
            onClose={() => handleCloseUploadModal(idx)}
            fileCount={(() => {
              // materialDetailRef.current가 있고 watch가 있으면 사용
              const refObj = materialDetailRef.current;
              if (refObj?.watch) {
                const images = refObj.watch(`locations.${idx}.images`);
                return 9 - (images?.length ?? 0);
              }
              return 9;
            })()}
            onComplete={(uploadedFiles: File[]) => {
              // 업로드된 파일들을 해당 위치의 이미지 배열에 추가
              const refObj = materialDetailRef.current;
              if (refObj?.watch && refObj?.setValue) {
                const currentImages =
                  refObj.watch(`locations.${idx}.images`) || [];
                const newImages = [...currentImages, ...uploadedFiles];
                refObj.setValue(`locations.${idx}.images`, newImages, {
                  shouldDirty: true,
                });
              }
            }}
          />
        ) : null
      )}
      {/* MaterialDetail의 거래처 정보 디테일 판넬 */}
      {selectedClientId && (
        <ClientDetailPanel
          onClose={() => setSelectedClientId(null)}
          refetchClient={() => {}}
          clientId={selectedClientId}
        />
      )}
      {/* MaterialDetail의 추가하기 버튼 모달 */}
      {isProductEnrollmentModalOpen && (
        <ProductEnrollmentModal
          materialId={selectedMaterialId}
          onClose={() => setIsProductEnrollmentModalOpen(false)}
          onSuccess={() => {
            // MaterialDetail의 productRequiringMaterialRef를 통해 refresh 호출
            const materialDetailRefObj = materialDetailRef.current;
            if (
              materialDetailRefObj?.productRequiringMaterialRef?.current
                ?.refresh
            ) {
              materialDetailRefObj.productRequiringMaterialRef.current.refresh();
            }
          }}
          checkDuplicateProductCode={checkDuplicateProductCode}
          showDuplicateProductToast={showDuplicateProductToast}
        />
      )}
      {/* 품목 연결하기에서 품목 코드 겹칠 시 토스트 */}
      {isToastOpen && (
        <Toast
          text="이미 존재하는 품목코드에요."
          subtext="다른 품목코드로 수정해주세요"
          icon={<WarningCircle size={20} className="text-red" />}
          type="red"
          isVisible={isVisible}
        />
      )}
      {/* 품목 연결하기에서 삭제 버튼 누를 시 모달 */}
      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleConfirmDelete}
        />
      )}
      {/* 연결된 품목 클릭 시 품목 디테일 판넬 열기 */}
      {selectedProductId && (
        <ProductDetailPanel
          onClose={handleProductDetailClose}
          productId={selectedProductId}
        />
      )}
    </>
  );
};

export default MaterialDetailPanel;
