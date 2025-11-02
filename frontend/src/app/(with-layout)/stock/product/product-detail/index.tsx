'use client';

import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import ProductInfo, { ProductInfoModel } from './product-info';
import MiniBtn from '@/ui/mini-btn';
import ProductHistory from './product-history';
import Bom from './bom';
import Panel from '@/ui/panel';
import {
  ProductModel,
  LocationModel,
  MaterialProductConnectionModel,
  ProductMaterialConnectionModel,
} from '@/types/data-model';

type ConnectionModelType =
  | MaterialProductConnectionModel
  | ProductMaterialConnectionModel;

import {
  useGetProduct,
  useUpdateProduct,
  useCreateSingleProduct,
  useLocation,
  useMaterialProduct,
} from '@/hooks';
import { useStagedMaterials } from '@/app/(with-layout)/stock/product/product-detail/bom/use-staged-materials';
// import NoHistoryBox from '@/ui/no-history-box';
import ConnectMaterialModal from '../modals/connect-material-modal';
// import StockLocationUploadModal from '../../modals/stock-location-upload-modal';
import { useForm, useFieldArray } from 'react-hook-form';
import { useUploadFile, useToast } from '@/hooks';
import MaterialDetailPanel from '../../material/material-detail';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react';
import useMemberStore from '@/store/member-store';
import ProjectStockHistoryModal from './product-history/modals/project-stock-history-modal';
import useSubscriptionStore from '@/store/subscription-store';
import LocationItem from '../../location-item';
import StockLocationModal from '../../modals/stock-location-modal';
import SubstituteMaterialsModal from './bom/modals/substitute-materials-modal';
import NoHistoryBox from '@/ui/no-history-box';

interface ProductDetailProps {
  productId: number | null;
  onClose: () => void;
  onSuccess?: (productId?: number) => void;
}

// type for locations form
interface LocationFormModel {
  locations: {
    id?: number; // location의 id (기존 데이터만), 새로 추가된 location은 id 없음
    location: string;
    images: (string | File)[];
  }[];
}

const ProductDetail = ({
  productId,
  onClose,
  onSuccess,
}: ProductDetailProps) => {
  const { getProductDetail, getAllProductCodes, allProductCodes, product } =
    useGetProduct();
  const { createSingleProduct } = useCreateSingleProduct();
  const { updateProduct, isLoading: isProductUpdating } = useUpdateProduct();
  const {
    getMaterialProductConnections,
    data: connections,
    updateMaterialProductConnection,
    isLoading: isMaterialProductLoading,
  } = useMaterialProduct();
  const factoryId = useMemberStore((state) => state.factoryId);
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const {
    createLocation,
    updateLocation,
    deleteLocation,
    data: locationListData,
    listLocations,
    isLoading: isLocationLoading,
  } = useLocation();
  const { uploadMultipleFiles, isUploading } = useUploadFile();

  // 폼데이터
  // - 제품 정보 저장
  const [formData, setFormData] = useState<ProductModel>({
    factory: factoryId as number,
    name: '',
    code: '',
    unit: '',
    spec: '',
    current_stock: undefined,
    average_production_time: undefined,
    buffer_rate: undefined,
    location: undefined,
    note: '',
  });
  // - 제품이 보관된 창고 위치 관련 RHF for locations
  const {
    control,
    // watch,
    // setValue,
    getValues,
    formState: { isDirty: isLocationDirty },
    reset,
  } = useForm<LocationFormModel>({
    defaultValues: { locations: [] },
  });
  const {
    fields: _fields,
    append: _append,
    remove: _remove,
  } = useFieldArray({
    control,
    name: 'locations',
  });
  // - 자재 수량 변경 추적
  const [quantityChanges, setQuantityChanges] = useState<
    Record<number, number>
  >({});
  // 폼 유효성 검사
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const productInfoRef = useRef<ProductInfoModel>(null);
  const [isQuantityDirty, setIsQuantityDirty] = useState(false); // 자재 수량 변경 감지를 위한 상태

  // 스테이징된 자재 관리 커스텀 훅
  const {
    stagedMaterials,
    persistStagedConnections,
    updateStagedQuantity,
    addStagedMaterials,
  } = useStagedMaterials();

  // 모달의 중복 차단을 위한 이미 연결된 자재 ID 목록
  const connectedMaterialIds = useMemo(() => {
    if (productId) {
      const list: ConnectionModelType[] =
        connections && Array.isArray(connections)
          ? (connections as ConnectionModelType[])
          : [];
      return list
        .map((c: ConnectionModelType) =>
          'material_id' in c ? c.material_id : undefined
        )
        .filter((v: number | undefined): v is number => typeof v === 'number')
        .filter(
          (id: number, idx: number, arr: number[]) => arr.indexOf(id) === idx
        );
    }
    return stagedMaterials
      .map((m) => m.id)
      .filter(
        (v: number | undefined | null): v is number => typeof v === 'number'
      )
      .filter(
        (id: number, idx: number, arr: number[]) => arr.indexOf(id) === idx
      );
  }, [productId, connections, stagedMaterials]);

  // 수량 변경 추적 함수
  const handleQuantityChange = (connectionId: number, newQuantity: number) => {
    setQuantityChanges((prev) => ({
      ...prev,
      [connectionId]: newQuantity,
    }));
    setIsQuantityDirty(true);
  };

  // 모달 오픈 상태
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [projectStockHistoryModal, setProjectStockHistoryModal] = useState<{
    isOpen: boolean;
    projectId?: number;
  }>({ isOpen: false, projectId: undefined });
  const [isStockLocationModalOpen, setIsStockLocationModalOpen] =
    useState(false);
  const [isSubstituteMaterialsModalOpen, setIsSubstituteMaterialsModalOpen] =
    useState(false);

  // 해당 원자재 클릭 시 보여줄 원자재 id와 해당 디테일 판넬
  const [materialId, setMaterialId] = useState<number | null>(null);

  // 각 StockLocationItem 별 모달 오픈 상태 관리
  // const [openUploadModals, setOpenUploadModals] = useState<boolean[]>([false]);

  // 토스트 상태
  const { isToastOpen, isVisible, showToast } = useToast();
  const [toastMessage, setToastMessage] = useState('');
  const [toastSubtext, setToastSubtext] = useState('');

  // 토스트 메시지 표시 함수
  const showToastMessage = (message: string, subtext?: string) => {
    setToastMessage(message);
    setToastSubtext(subtext || '');
    showToast();
  };

  // productId가 변경되면 상세 정보 로드
  useEffect(() => {
    if (productId && factoryId) {
      getProductDetail(productId);
    }
  }, [productId, factoryId, getProductDetail]);

  // 모든 제품 코드 로드 (중복 검증용)
  useEffect(() => {
    if (factoryId) {
      getAllProductCodes();
    }
  }, [factoryId, getAllProductCodes]);

  // product가 로드되면 formData 업데이트
  useEffect(() => {
    if (productId && product) {
      setFormData({
        factory: product.factory,
        name: product.name,
        code: product.code,
        unit: product.unit,
        spec: product.spec,
        current_stock: product.current_stock,
        average_production_time: product.average_production_time,
        buffer_rate: product.buffer_rate,
        location: product.location?.toString() || '',
        note: product.note,
      });
    } else if (!productId) {
      const currentFactoryId = factoryId;
      setFormData({
        factory: currentFactoryId as number,
        name: '',
        code: '',
        unit: '',
        spec: '',
        current_stock: undefined,
        average_production_time: undefined,
        buffer_rate: undefined,
        location: undefined,
        note: '',
      });
    }
  }, [productId, product, factoryId]);

  // 서버 location 데이터를 RHF locations 배열에 세팅
  useEffect(() => {
    if (locationListData && 'locations' in locationListData) {
      const serverLocations = locationListData.locations.map(
        (loc: LocationModel) => ({
          id: loc.id,
          location: loc.location ?? '',
          images: loc.images ?? [],
        })
      );
      reset({ locations: serverLocations });
    }
  }, [locationListData, reset]);

  useEffect(() => {
    if (productId) {
      listLocations('product', productId);
    }
  }, [productId, listLocations, factoryId]);

  // 연결된 자재의 id를 가져오기
  useEffect(() => {
    if (productId) {
      getMaterialProductConnections(productId, 'product');
    }
  }, [productId, getMaterialProductConnections]);

  ////////////////////////////////
  // 함수
  // StockLocationItem 추가 함수
  // const handleAddStockLocation = () => {
  //   append({ location: '', images: [] });
  //   setOpenUploadModals((prev) => [...prev, false]);
  // };

  // Plus 버튼 클릭 시 사진 추가 모달 오픈
  // const _handleOpenUploadModal = (index: number) => {
  //   setOpenUploadModals((prev) => {
  //     const newModals = [...prev];
  //     // 배열 크기가 부족하면 확장
  //     while (newModals.length <= index) {
  //       newModals.push(false);
  //     }
  //     newModals[index] = true;
  //     return newModals;
  //   });
  // };
  // // 사진 추가 모달 닫기
  // const handleCloseUploadModal = (index: number) => {
  //   setOpenUploadModals((prev) => {
  //     const newModals = [...prev];
  //     // 배열 크기가 부족하면 확장
  //     while (newModals.length <= index) {
  //       newModals.push(false);
  //     }
  //     newModals[index] = false;
  //     return newModals;
  //   });
  // };

  // ProductInfo 저장 함수
  const handleSaveProductInfo = async (): Promise<{
    success: boolean;
    productId?: number;
  }> => {
    try {
      // ProductInfo에서 현재 폼 값 가져오기
      const currentFormData = productInfoRef.current?.getValues() || formData;

      // 제품코드 중복 검사 함수
      const checkCodeDuplicate = (
        code: string,
        currentProductId?: number | null
      ) => {
        // 현재 제품의 코드는 제외하고 중복 검사
        const otherCodes = allProductCodes.filter((existingCode: string) => {
          // 수정 모드에서는 현재 제품의 코드는 제외
          if (currentProductId && product && product.code === existingCode) {
            return false;
          }
          const isDuplicate = existingCode === code;
          return isDuplicate;
        });

        const hasDuplicate = otherCodes.length > 0;

        return hasDuplicate;
      };

      if (productId) {
        // 수정 모드
        // 제품코드가 변경되었고 중복인지 확인
        if (
          currentFormData.code !== product?.code &&
          checkCodeDuplicate(currentFormData.code, productId)
        ) {
          showToastMessage('이미 존재하는 제품코드에요.');
          return { success: false };
        }

        // factory 필드는 수정 시 제외 (서버에서 Factory 인스턴스를 기대함)
        const { factory: _factory, ...updateDataWithoutFactory } =
          currentFormData;
        const updateData = {
          ...updateDataWithoutFactory,
          current_stock:
            currentFormData.current_stock === undefined ||
            currentFormData.current_stock === null
              ? undefined
              : currentFormData.current_stock,
          average_production_time: currentFormData.average_production_time,
        };
        // undefined를 null로 변환해서 보냄 (수정 시에는 null 명시)
        const payload: Partial<ProductModel> & {
          current_stock: number | null;
        } = {
          ...updateData,
          current_stock:
            updateData.current_stock === undefined
              ? null
              : updateData.current_stock,
        };
        const result = await updateProduct(productId, payload);
        if (result && result.success) {
          // 성공 시 onSuccess 호출하여 상위 컴포넌트에 알림
          onSuccess?.(productId);
          return { success: true, productId };
        } else {
          showToastMessage(
            '제품 수정에 실패하였습니다. ' +
              (result?.error || '알 수 없는 오류')
          );
          return { success: false };
        }
      } else {
        // 생성 모드 - 중복 코드 검증
        if (checkCodeDuplicate(currentFormData.code)) {
          showToastMessage(
            '이미 존재하는 제품코드에요.',
            '다른 제품코드로 수정해주세요.'
          );
          return { success: false };
        }

        // 로컬스토리지에서 factoryId 가져오기
        const storedFactoryId = factoryId;
        if (!storedFactoryId) {
          showToastMessage('공장 ID가 설정되지 않았습니다.');
          return { success: false };
        }

        // 데이터 변환
        const createData = {
          factory_id: storedFactoryId,
          name: currentFormData.name,
          code: currentFormData.code,
          spec: currentFormData.spec,
          unit: currentFormData.unit,
          current_stock:
            currentFormData.current_stock === undefined ||
            currentFormData.current_stock === null
              ? undefined
              : currentFormData.current_stock,
        };
        // undefined를 null로 변환해서 보냄
        const payload = { ...createData };
        if (payload.current_stock === undefined) {
          delete payload.current_stock;
        }
        const result = await createSingleProduct(payload);
        if (result && result.success) {
          // 새로운 제품이 생성되었을 때 product_id를 onSuccess로 전달
          if (result.data && result.data.product_id) {
            onSuccess?.(result.data.product_id);
            return { success: true, productId: result.data.product_id };
          }
          return { success: true };
        } else {
          showToastMessage(
            '제품 생성에 실패하였습니다. ' +
              (result?.error || '알 수 없는 오류')
          );
          return { success: false };
        }
      }
    } catch (error) {
      showToastMessage('저장 중 오류가 발생했습니다. ' + error);
      return { success: false };
    }
  };

  // locations 저장 함수
  const handleSaveLocations = async (
    locations: LocationFormModel['locations'],
    prevLocations: LocationModel[],
    productId: number | null
  ) => {
    if (!productId) return;
    // 1. 삭제: prevLocations에만 있고, locations에는 없는 location은 삭제
    for (const prevLoc of prevLocations) {
      // prevLoc.id는 location의 id임
      if (!locations.some((loc) => loc.id === prevLoc.id)) {
        await deleteLocation(prevLoc.id, 'product');
      }
    }
    // 2. 생성/수정
    for (const loc of locations) {
      // File 객체와 string URL 분리
      const fileImages = (loc.images ?? []).filter(
        (img) => img instanceof File
      ) as File[];
      const urlImages = (loc.images ?? []).filter(
        (img) => typeof img === 'string'
      ) as string[];
      // File 객체가 있으면 S3에 업로드
      let uploadedUrls: string[] = [];
      if (fileImages.length > 0) {
        const uploadResults = await uploadMultipleFiles(fileImages);
        uploadedUrls = uploadResults
          .filter(
            (res: { success: boolean; object_url?: string }) =>
              res.success && !!res.object_url
          )
          .map(
            (res: { success: boolean; object_url?: string }) =>
              res.object_url || ''
          );
      }
      // 최종 images 배열: 기존 string URL + 새로 업로드된 URL
      const images = [...urlImages, ...uploadedUrls];
      if (loc.id) {
        // 2-1. id가 있으면 PATCH (location의 id)
        await updateLocation(loc.id, {
          type: 'product',
          location: loc.location,
          images,
        });
      } else {
        // 2-2. id가 없으면 POST (product의 id)
        await createLocation({
          type: 'product',
          id: productId, // product의 id
          location: loc.location,
          images,
        });
      }
    }
  };

  // 통합 저장 함수
  const handleSave = async () => {
    const isProductInfoChanged = isDirty;
    const isLocationsChanged = isLocationDirty;
    const isQuantitiesChanged = isQuantityDirty;
    const prevLocations =
      locationListData && 'locations' in locationListData
        ? locationListData.locations
        : [];

    // 수량 변경사항 저장
    if (isQuantitiesChanged && Object.keys(quantityChanges).length > 0) {
      try {
        const updatePromises = Object.entries(quantityChanges).map(
          ([connectionId, newQuantity]) =>
            updateMaterialProductConnection(parseInt(connectionId), newQuantity)
        );
        await Promise.all(updatePromises);
        setQuantityChanges({}); // 변경사항 초기화
        setIsQuantityDirty(false);
      } catch {
        alert('수량 변경사항 저장에 실패했습니다.');
        return;
      }
    }

    // 제품 정보와 위치 정보 저장
    if (isProductInfoChanged && isLocationsChanged) {
      const result = await handleSaveProductInfo();
      if (result.success) {
        const effectiveProductId = productId || result.productId || null;
        if (effectiveProductId) {
          await handleSaveLocations(
            getValues('locations'),
            prevLocations,
            effectiveProductId
          );
          // 생성 모드에서 임시로 추가한 원자재 연결 저장
          if (stagedMaterials.length > 0) {
            await persistStagedConnections(effectiveProductId);
          }
        }
        onSuccess?.();
        onClose();
      }
    } else if (isProductInfoChanged) {
      const result = await handleSaveProductInfo();
      if (result.success) {
        const effectiveProductId = productId || result.productId || null;
        if (effectiveProductId && stagedMaterials.length > 0) {
          await persistStagedConnections(effectiveProductId);
        }
        onSuccess?.();
        onClose();
      }
    } else if (isLocationsChanged) {
      await handleSaveLocations(
        getValues('locations'),
        prevLocations,
        productId
      );
      onSuccess?.();
      onClose();
    } else if (isQuantitiesChanged) {
      // 자재 수량만 변경된 경우
      onSuccess?.();
      onClose();
    }
  };

  // factory ID가 없으면 로딩 상태나 에러 메시지를 표시
  if (!factoryId) {
    return (
      <Panel title="제품 재고관리" onClose={onClose}>
        <></>
      </Panel>
    );
  }

  return (
    <>
      <Panel
        title="제품 재고관리"
        onClose={onClose}
        headerButton={
          (isDirty || isLocationDirty || isQuantityDirty) && (
            <MiniBtn
              text="저장"
              textColor="text-primary"
              bgColor="bg-primary-8"
              hoverColor="hover:bg-secondary-hover"
              onClick={handleSave}
              disabled={
                !isValid ||
                isLocationLoading ||
                isProductUpdating ||
                isMaterialProductLoading ||
                isUploading
              }
            />
          )
        }
      >
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            {/* 제품 정보 */}
            <h3 className="Heading-3 text-dg h-10 flex items-center">
              제품 정보
            </h3>
            <ProductInfo
              formData={formData}
              productId={productId}
              onIsDirtyChange={setIsDirty}
              onIsValidChange={setIsValid}
              ref={productInfoRef}
            />
          </div>

          {/* 제품이 보관된 창고 위치 */}
          <div className="flex flex-col gap-3">
            <div className="h-10 flex items-center justify-between">
              <h3 className="Heading-3 h-10 flex items-center text-dg ">
                제품이 보관된 창고 위치
              </h3>
              {/* <MiniBtn
                text="추가"
                variant="whiteOutline"
                onClick={handleAddStockLocation}
                disabled={isViewer || !hasSubscription()}
              /> */}
              <MiniBtn
                text="추가"
                variant="whiteOutline"
                disabled={isViewer || !hasSubscription()}
                onClick={() => setIsStockLocationModalOpen(true)}
              />
            </div>
            {/* locations가 없을 때 */}
            {locationListData?.locations.length === 0 ? (
              <NoHistoryBox
                title="등록된 창고 위치가 아직 없어요."
                text="[추가] 버튼을 눌러 제품이 보관된 창고를 등록해보세요."
              />
            ) : (
              <div className="p-5 rounded-[8px] border border-lg flex flex-col gap-3">
                {locationListData?.locations.map((loc: LocationModel) => (
                  <LocationItem
                    key={loc.id}
                    image={loc.images?.[0] || ''}
                    length={loc.images?.length || 0}
                    email={loc.email}
                    role={loc.role}
                    location={loc.location || ''}
                    memo={loc.memo}
                    created_at={loc.created_at}
                    updated_at={loc.updated_at}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 제품과 연결된 자재 정보 */}
          <Bom
            productId={productId}
            connections={connections}
            stagedMaterials={stagedMaterials}
            quantityChanges={quantityChanges}
            hasSubscription={hasSubscription}
            onMaterialModalOpen={() => setIsMaterialModalOpen(true)}
            onMaterialIdChange={setMaterialId}
            onQuantityDirtyChange={setIsQuantityDirty}
            onQuantityChange={handleQuantityChange}
            onInvalidQuantity={showToastMessage}
            onStagedQuantityChange={updateStagedQuantity}
            onConnectionsRefresh={async () => {
              if (productId) {
                await getMaterialProductConnections(productId, 'product');
              }
            }}
            setIsSubstituteMaterialsModalOpen={
              setIsSubstituteMaterialsModalOpen
            }
          />

          {/* 제품 입·출고 내역 */}
          <ProductHistory
            productId={productId}
            setIsProjectStockHistoryModalOpen={setProjectStockHistoryModal}
          />
        </div>
      </Panel>

      {/* 자재 연결 모달 */}
      {isMaterialModalOpen && (
        <ConnectMaterialModal
          productId={productId}
          onClose={() => setIsMaterialModalOpen(false)}
          onSuccess={async () => {
            // 자재 연결 성공 시 연결된 자재 정보 새로고침
            if (productId) {
              await getMaterialProductConnections(productId, 'product');
            }
          }}
          connectedMaterialIds={connectedMaterialIds}
          onStage={addStagedMaterials}
        />
      )}

      {/* 자재 디테일 판넬 */}
      {materialId && (
        <MaterialDetailPanel
          setIsMaterialDetailOpen={() => setMaterialId(null)}
          selectedMaterialId={materialId}
          onSuccess={async () => {
            // 저장 성공시에만 연결 목록을 갱신
            if (productId) {
              await getMaterialProductConnections(productId, 'product');
            }
            // 마지막에 닫기
            setMaterialId(null);
          }}
        />
      )}

      {/* 각 StockLocationItem 별 모달 렌더링 */}
      {/* {openUploadModals.map((open, idx) =>
        open ? (
          <StockLocationUploadModal
            key={idx}
            onClose={() => handleCloseUploadModal(idx)}
            fileCount={9 - (watch(`locations.${idx}.images`)?.length ?? 0)}
            onComplete={(uploadedFiles) => {
              const prevImages = watch(`locations.${idx}.images`) ?? [];
              const newImages = [...prevImages, ...uploadedFiles];
              setValue(`locations.${idx}.images`, newImages, {
                shouldDirty: true,
              });
            }}
          />
        ) : null
      )} */}

      {/* 대체자재 모달 */}
      {isSubstituteMaterialsModalOpen && (
        <SubstituteMaterialsModal
          onClose={() => setIsSubstituteMaterialsModalOpen(false)}
        />
      )}

      {/* 재고 변동 내역 모달 */}
      {projectStockHistoryModal.isOpen && (
        <ProjectStockHistoryModal
          projectId={projectStockHistoryModal.projectId}
          productId={productId ?? undefined}
          onClose={() =>
            setProjectStockHistoryModal({ isOpen: false, projectId: undefined })
          }
        />
      )}

      {/* 제품 생성 시 제품 코드 중복 토스트 */}
      {isToastOpen && (
        <Toast
          icon={<WarningCircle size={20} className="text-red" />}
          text={toastMessage}
          subtext={toastSubtext}
          type="red"
          isVisible={isVisible}
        />
      )}

      {/* 창고 위치 추가 모달 열기 */}
      {isStockLocationModalOpen && (
        <StockLocationModal
          mode="add"
          onClose={() => setIsStockLocationModalOpen(false)}
        />
      )}
    </>
  );
};

export default ProductDetail;
