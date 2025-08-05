'use client';

import { useState, useEffect, useRef } from 'react';
import ProductInfo, { ProductInfoModel } from './product-info';
import MiniBtn from '@/ui/mini-btn';
import StockStatus from './stock-status';
import ProductHistory from './product-history';
import Panel from '@/ui/panel';
import Spinner from '@/ui/spinner';
import {
  ProductModel,
  LocationModel,
  MaterialResponseModel,
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
  useGetMaterial,
} from '@/hooks';
import NoHistoryBox from '@/ui/no-history-box';
import ConnectMaterialModal from '../modals/connect-material-modal';
import StockLocationUploadModal from '../../modals/stock-location-upload-modal';
import { useForm, useFieldArray } from 'react-hook-form';
import StockLocationItem from '../../stock-location-item';
import { useUploadFile, useToast } from '@/hooks';
import MaterialDetailPanel from '../../material/material-detail';
import DeleteModal from '@/ui/modal/delete-modal';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react';

// 로컬스토리지에서 factoryId를 안전하게 가져오는 함수
const getStoredFactoryId = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('factoryId');
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
};

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
    deleteMaterialProductConnection,
    resetData,
    isLoading: isMaterialProductLoading,
  } = useMaterialProduct();
  const { getMaterialDetail } = useGetMaterial();
  const factoryId = getStoredFactoryId();
  const {
    createLocation,
    updateLocation,
    deleteLocation,
    data: locationListData,
    listLocations,
    isLoading: isLocationLoading,
  } = useLocation();
  const { uploadMultipleFiles, isUploading } = useUploadFile();

  // 여러 자재의 상세 정보를 저장할 상태
  const [materialDetails, setMaterialDetails] = useState<
    Record<number, MaterialResponseModel>
  >({});

  // 폼데이터
  // - 품목 정보 저장
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
  // - 품목이 보관된 창고 위치 관련 RHF for locations
  const {
    control,
    watch,
    setValue,
    getValues,
    formState: { isDirty: isLocationDirty },
    reset,
  } = useForm<LocationFormModel>({
    defaultValues: { locations: [] },
  });
  const { fields, append, remove } = useFieldArray({
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
  // const [isProductStockModalOpen, setIsProductStockModalOpen] = useState(false);

  // 해당 원자재 클릭 시 보여줄 원자재 id와 해당 디테일 판넬
  const [materialId, setMaterialId] = useState<number | null>(null);
  const [isMaterialDetailPanelOpen, setIsMaterialDetailPanelOpen] =
    useState(false);

  // 원자재 디테일 패널이 닫힐 때 데이터 새로고침
  const handleMaterialDetailClose = async () => {
    setIsMaterialDetailPanelOpen(false);
    setMaterialId(null);

    // 품목 데이터와 연결된 원자재 데이터 다시 로드
    if (productId) {
      // 1. 품목 상세 정보 다시 로드
      await getProductDetail(productId);

      // 2. 연결된 원자재 정보 다시 로드
      resetData(); // 기존 연결 데이터 초기화
      await getMaterialProductConnections(productId, 'product');

      // 3. 원자재 상세 정보도 다시 로드 (재고량 업데이트 반영)
      setMaterialDetails({});
    }
  };

  // 각 StockLocationItem 별 모달 오픈 상태 관리
  const [openUploadModals, setOpenUploadModals] = useState<boolean[]>([false]);

  // 연결된 자재 정보 삭제 확인 모달
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConnectionId, setDeleteConnectionId] = useState<number | null>(
    null
  );

  // 토스트 상태
  const { isToastOpen, isVisible, showToast } = useToast();
  const [toastMessage, setToastMessage] = useState('');

  // 토스트 메시지 표시 함수
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    showToast();
  };

  // 연결 삭제 핸들러
  const handleDeleteConnection = (connectionId: number) => {
    setDeleteConnectionId(connectionId);
    setIsDeleteModalOpen(true);
  };

  // 연결 삭제 실행
  const handleConfirmDelete = async (connectionId: number) => {
    if (!connectionId) return;

    setIsDeleting(true);
    try {
      const result = await deleteMaterialProductConnection(connectionId);
      if (result.success) {
        // 삭제 성공 시 연결된 자재 정보 새로고침
        if (productId) {
          // 연결된 자재 목록 초기화
          resetData();
          // 연결된 자재 목록 다시 로드
          await getMaterialProductConnections(productId, 'product');
        }
      } else {
        alert('연결 삭제에 실패했습니다: ' + result.error);
      }
    } catch {
      alert('연결 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeleteConnectionId(null);
    }
  };

  // 모달에서 삭제 확인 시 호출되는 함수
  const handleModalConfirmDelete = () => {
    if (deleteConnectionId) {
      handleConfirmDelete(deleteConnectionId);
    }
  };

  // productId가 변경되면 상세 정보 로드
  useEffect(() => {
    if (productId && factoryId) {
      getProductDetail(productId);
    }
  }, [productId, factoryId, getProductDetail]);

  // 모든 품목 코드 로드 (중복 검증용)
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
      const currentFactoryId = getStoredFactoryId();
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
  }, [productId, product]);

  // 서버 location 데이터를 RHF locations 배열에 세팅
  useEffect(() => {
    if (locationListData && 'locations' in locationListData) {
      const serverLocations = locationListData.locations.map((loc) => ({
        id: loc.id,
        location: loc.location ?? '',
        images: loc.images ?? [],
      }));
      reset({ locations: serverLocations });
    }
  }, [locationListData, reset]);

  useEffect(() => {
    if (productId) {
      listLocations('product', productId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // 연결된 자재의 id를 가져오기
  useEffect(() => {
    if (productId) {
      getMaterialProductConnections(productId, 'product');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    if (connections && Array.isArray(connections) && connections.length > 0) {
      // 연결된 자재의 상세 정보를 가져오기
      connections.forEach(async (connection: ConnectionModelType) => {
        // MaterialProductConnectionModel인지 확인
        if ('material_id' in connection && connection.material_id) {
          if (!materialDetails[connection.material_id]) {
            try {
              const result = await getMaterialDetail(connection.material_id);
              if (result.success && result.data) {
                setMaterialDetails((prev) => ({
                  ...prev,
                  [connection.material_id]: result.data,
                }));
              }
            } catch {
              throw new Error('원자재 상세 정보 조회 실패');
            }
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections, getMaterialDetail]);

  ////////////////////////////////
  // 함수
  // StockLocationItem 추가 함수
  const handleAddStockLocation = () => {
    append({ location: '', images: [] });
    setOpenUploadModals((prev) => [...prev, false]);
  };

  // Plus 버튼 클릭 시 사진 추가 모달 오픈
  const handleOpenUploadModal = (index: number) => {
    setOpenUploadModals((prev) => {
      const newModals = [...prev];
      // 배열 크기가 부족하면 확장
      while (newModals.length <= index) {
        newModals.push(false);
      }
      newModals[index] = true;
      return newModals;
    });
  };
  // 사진 추가 모달 닫기
  const handleCloseUploadModal = (index: number) => {
    setOpenUploadModals((prev) => {
      const newModals = [...prev];
      // 배열 크기가 부족하면 확장
      while (newModals.length <= index) {
        newModals.push(false);
      }
      newModals[index] = false;
      return newModals;
    });
  };

  // ProductInfo 저장 함수
  const handleSaveProductInfo = async (): Promise<boolean> => {
    try {
      // ProductInfo에서 현재 폼 값 가져오기
      const currentFormData = productInfoRef.current?.getValues() || formData;

      // 품목코드 중복 검사 함수
      const checkCodeDuplicate = (
        code: string,
        currentProductId?: number | null
      ) => {
        // 현재 제품의 코드는 제외하고 중복 검사
        const otherCodes = allProductCodes.filter((existingCode) => {
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
        // 품목코드가 변경되었고 중복인지 확인
        if (
          currentFormData.code !== product?.code &&
          checkCodeDuplicate(currentFormData.code, productId)
        ) {
          showToastMessage('이미 존재하는 품목코드에요.');
          return false;
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
          // 성공 시 처리
          return true;
        } else {
          showToastMessage(
            '품목 수정에 실패하였습니다. ' +
              (result?.error || '알 수 없는 오류')
          );
          return false;
        }
      } else {
        // 생성 모드 - 중복 코드 검증
        if (checkCodeDuplicate(currentFormData.code)) {
          showToastMessage('이미 존재하는 품목코드에요.');
          return false;
        }

        // 로컬스토리지에서 factoryId 가져오기
        const storedFactoryId = getStoredFactoryId();
        if (!storedFactoryId) {
          showToastMessage('공장 ID가 설정되지 않았습니다.');
          return false;
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
          }
          return true;
        } else {
          showToastMessage(
            '품목 생성에 실패하였습니다. ' +
              (result?.error || '알 수 없는 오류')
          );
          return false;
        }
      }
    } catch (error) {
      showToastMessage('저장 중 오류가 발생했습니다. ' + error);
      return false;
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
          .filter((res) => res.success && res.object_url)
          .map((res) => res.object_url || '');
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

    // 품목 정보와 위치 정보 저장
    if (isProductInfoChanged && isLocationsChanged) {
      const isSuccess = await handleSaveProductInfo();
      if (isSuccess) {
        await handleSaveLocations(
          getValues('locations'),
          prevLocations,
          productId
        );
        onSuccess?.();
        onClose();
      }
    } else if (isProductInfoChanged) {
      const isSuccess = await handleSaveProductInfo();
      if (isSuccess) {
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
  if (!getStoredFactoryId()) {
    return (
      <Panel title="품목 재고관리" onClose={onClose}>
        <div className="flex flex-col items-center justify-center h-100 gap-3">
          <Spinner />
        </div>
      </Panel>
    );
  }

  return (
    <>
      <Panel
        title="품목 재고관리"
        onClose={onClose}
        headerButton={
          (!productId ||
            (productId && (isDirty || isLocationDirty || isQuantityDirty))) && (
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
            {/* 품목 정보 */}
            <h3 className="Heading-3 text-dg h-10 flex items-center">
              품목 정보
            </h3>
            <ProductInfo
              formData={formData}
              productId={productId}
              onIsDirtyChange={setIsDirty}
              onIsValidChange={setIsValid}
              ref={productInfoRef}
            />
          </div>

          {/* 품목이 보관된 창고 위치 */}
          <div className="flex flex-col gap-3">
            <div className="h-10 flex items-center justify-between">
              <h3 className="Heading-3 h-10 flex items-center text-dg ">
                품목이 보관된 창고 위치
              </h3>
              <MiniBtn
                text="추가"
                textColor="text-dg"
                borderColor="border-lg"
                hoverColor="hover:bg-bg"
                onClick={handleAddStockLocation}
              />
            </div>
            {/* locations가 없을 때 */}
            {fields.length === 0 ? (
              <NoHistoryBox
                title="등록된 창고 위치가 아직 없어요."
                text="[추가] 버튼을 눌러 원자재가 보관된 창고를 등록해보세요."
              />
            ) : (
              fields.map((field, index) => (
                <StockLocationItem
                  key={field.id}
                  index={index}
                  control={control}
                  remove={remove}
                  openUploadModal={() => handleOpenUploadModal(index)}
                  images={watch(`locations.${index}.images`)}
                  setValue={setValue}
                />
              ))
            )}
          </div>

          {/* 품목과 연결된 자재 정보 */}
          <div className="flex flex-col gap-3">
            <div className="h-10 flex items-center justify-between">
              <h3 className="Heading-3 h-10 flex items-center text-dg ">
                품목과 연결된 자재 정보
              </h3>
              <MiniBtn
                text="자재 연결"
                textColor="text-dg"
                borderColor="border-lg"
                hoverColor="hover:bg-bg"
                onClick={() => setIsMaterialModalOpen(true)}
              />
            </div>
            <StockStatus
              connections={
                connections && Array.isArray(connections)
                  ? (connections as ConnectionModelType[])
                  : []
              }
              materialDetails={materialDetails}
              setIsMaterialDetailPanelOpen={setIsMaterialDetailPanelOpen}
              setMaterialId={setMaterialId}
              setIsQuantityDirty={setIsQuantityDirty}
              handleQuantityChange={handleQuantityChange}
              onDeleteConnection={handleDeleteConnection}
              onInvalidQuantity={showToastMessage}
            />
          </div>

          {/* 품목 입·출고 내역 */}
          <ProductHistory productId={productId} />
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
        />
      )}

      {/* 자재 디테일 판넬 */}
      {isMaterialDetailPanelOpen && materialId && (
        <MaterialDetailPanel
          setIsMaterialDetailOpen={handleMaterialDetailClose}
          selectedMaterialId={materialId}
        />
      )}

      {/* 각 StockLocationItem 별 모달 렌더링 */}
      {openUploadModals.map((open, idx) =>
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
      )}

      {/* 연결된 자재 정보 삭제 확인 모달 */}
      {isDeleteModalOpen && deleteConnectionId && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleModalConfirmDelete}
          isLoading={isDeleting}
        />
      )}

      {/* 품목 생성 시 품목 코드 중복 토스트 */}
      {isToastOpen && (
        <Toast
          icon={<WarningCircle size={20} className="text-red" />}
          text={toastMessage}
          subtext={
            toastMessage.includes('품목코드')
              ? '다른 품목코드로 수정해주세요.'
              : ''
          }
          type="red"
          isVisible={isVisible}
        />
      )}

      {/* {isProductStockModalOpen && (
        <ProductStockModal onClose={() => setIsProductStockModalOpen(false)} />
      )} */}
      {/* {isMaterialStockStatusModalOpen && (
        <MaterialStockStatusModal
          onClose={() => setIsMaterialStockStatusModalOpen(false)}
        />
      )} */}
    </>
  );
};

export default ProductDetail;
