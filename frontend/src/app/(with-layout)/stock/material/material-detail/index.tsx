import Panel from '@/ui/panel';
import React, { useEffect, useRef, useState } from 'react';
import MaterialDetail, { MaterialInfoModel } from './material-detail';
import MiniBtn from '@/ui/mini-btn';
import { useLocation, useUpdateMaterial } from '@/hooks';
import { useUploadFile } from '@/hooks';
import { useMaterialReloadStore } from '@/store/material-reload-store';
import CustomerInfoModal from '../modals/customer-info-modal';
import ProductEnrollmentModal from '../modals/product-enrollment-modal';
import StockLocationUploadModal from '../../modals/stock-location-upload-modal';

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
  const [isCustomerInfoModalOpen, setIsCustomerInfoModalOpen] = useState(false);
  const [isProductEnrollmentModalOpen, setIsProductEnrollmentModalOpen] =
    useState(false);
  const [openUploadModals, setOpenUploadModals] = useState<boolean[]>([false]);

  const { createLocation, updateLocation, deleteLocation, listLocations } =
    useLocation();
  const { uploadMultipleFiles } = useUploadFile();
  const [prevLocations, setPrevLocations] = useState<LocationModel[]>([]);
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

    let hasSaved = false;

    // 1. 원자재 정보 저장
    if (refObj.isDirty) {
      const values = refObj.getValues();
      const payload: Record<string, number> = {};
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
            />
          )
        }
      >
        <MaterialDetail
          ref={materialDetailRef}
          materialId={selectedMaterialId}
          locations={prevLocations}
          setIsCustomerInfoModalOpen={setIsCustomerInfoModalOpen}
          setIsProductEnrollmentModalOpen={setIsProductEnrollmentModalOpen}
          handleOpenUploadModal={handleOpenUploadModal}
          onIsDirtyChange={setIsMaterialDetailDirty}
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
      {/* MaterialDetail의 거래처 정보 상세보기 모달 */}
      {isCustomerInfoModalOpen && (
        <CustomerInfoModal onClose={() => setIsCustomerInfoModalOpen(false)} />
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
        />
      )}
    </>
  );
};

export default MaterialDetailPanel;
