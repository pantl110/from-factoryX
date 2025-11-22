import { MiniBtn } from '@/ui';
import MaterialInfo, { MaterialInfoModel } from './material-info';
import ProductRequiringMaterial from './product-requiring-material';
import QuotationHistory from './quotation-history';
import MaterialStockLog from './material-stock-log';
import {
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { ProductRequiringMaterialRefModel } from './product-requiring-material';
import { useGetMaterialHistory } from '@/hooks';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import StockLocation from './stock-location';
import { SubMaterials, SubMaterialsRefModel } from './sub-materials';
import { MaterialStockIn } from './material-stock-in';
import { MaterialPackaging } from './material-packaging';
import { MaterialStockOut } from './material-stock-out';

export type { MaterialInfoModel } from './material-info';

interface LocationFormModel {
  locations: {
    id?: number;
    location: string;
    images: (string | File)[];
    email?: string;
    role?: string;
    memo?: string;
    created_at?: string;
    updated_at?: string;
  }[];
}

interface MaterialDetailProps {
  materialId: number;
  setIsProductEnrollmentModalOpen: (v: boolean) => void;
  // handleOpenUploadModal: (index: number) => void;
  setIsUploadModalOpen: (isOpen: boolean) => void;
  onLocationClick?: (locationId: number) => void;
  onDeleteLocation?: (index: number, locationId?: number) => void;
  onIsDirtyChange?: (isDirty: boolean) => void;
  locations?: LocationFormModel['locations'];
  setIsClinetDetailPanelOpen: (clientId: number) => void;
  handleOpenDeleteModal: (connectionId: number) => void;
  onProductClick?: (productId: number) => void;
  clientWasModified?: boolean; // 클라이언트가 실제로 수정되어 저장되었는지
  productWasModified?: boolean; // 제품이 실제로 연결/삭제되었는지
  showToast?: (text: string, subtext: string) => void;
  setIsMaterialPackagingDetailModalOpen: (mode: 'create' | 'update') => void;
  setIsCreateSubstituteModalOpen: (v: boolean) => void;
  handleOpenDeleteSubstituteModal: (
    sourceMaterialId: number,
    targetMaterialId: number
  ) => void;
  isLocationLoading?: boolean;
}

const MaterialDetail = forwardRef<MaterialInfoModel, MaterialDetailProps>(
  (
    {
      materialId,
      setIsProductEnrollmentModalOpen,
      // handleOpenUploadModal,
      setIsUploadModalOpen,
      onLocationClick,
      onDeleteLocation,
      onIsDirtyChange,
      locations,
      setIsClinetDetailPanelOpen,
      handleOpenDeleteModal,
      onProductClick,
      clientWasModified,
      productWasModified,
      setIsMaterialPackagingDetailModalOpen,
      setIsCreateSubstituteModalOpen,
      handleOpenDeleteSubstituteModal,
      isLocationLoading,
    },
    ref
  ) => {
    // RHF for locations
    const {
      control,
      watch,
      setValue,
      getValues: getLocationValues,
      formState: { isDirty: isRhfDirty },
      reset,
    } = useForm<LocationFormModel>({
      defaultValues: { locations: [] },
    });

    const { fields, remove } = useFieldArray({
      control,
      name: 'locations',
    });

    const role = useMemberStore((state) => state.role);
    const isViewer = role === 'viewer';
    const hasSubscription = useSubscriptionStore(
      (state) => state.hasSubscription
    );

    // isDirty 상태 추적 (MaterialInfo, StockLocation 각각)
    const [isDirtyMaterialInfo, setIsDirtyMaterialInfo] = useState(false);
    const [isDirtyStockLocation, setIsDirtyStockLocation] = useState(false);
    useEffect(() => {
      setIsDirtyStockLocation(isRhfDirty);
    }, [isRhfDirty]);
    useEffect(() => {
      if (onIsDirtyChange)
        onIsDirtyChange(isDirtyMaterialInfo || isDirtyStockLocation);
    }, [isDirtyMaterialInfo, isDirtyStockLocation, onIsDirtyChange]);

    // MaterialInfo ref (내부에서만 사용)
    const materialInfoRef = useRef<MaterialInfoModel>(null);
    const productRequiringMaterialRef =
      useRef<ProductRequiringMaterialRefModel>(null);
    const subMaterialsRef = useRef<SubMaterialsRefModel>(null);

    // 페이지네이션 상태 (각 섹션별로 독립적)
    const [priceCurrentPage, setPriceCurrentPage] = useState(1);
    const [stockCurrentPage, setStockCurrentPage] = useState(1);
    const pageSize = 5;

    // 업체별 단가 비교 조회 훅 (타입: 구매만)
    const { histories: priceHistories, refetch: refetchPriceHistory } =
      useGetMaterialHistory({
        material_id: materialId,
        type: 'purchase',
        page: priceCurrentPage,
        page_size: pageSize,
      });

    // 재고 이력 조회 훅 (전체)
    const { histories: stockHistories, isLoading: isStockLoading } =
      useGetMaterialHistory({
        material_id: materialId,
        page: stockCurrentPage,
        page_size: pageSize,
      });

    // 업체별 단가 비교 페이지 변경 핸들러
    const handlePricePageChange = (page: number) => {
      setPriceCurrentPage(page);
    };

    // 재고 이력 페이지 변경 핸들러 (타입: 전체)
    const handleStockPageChange = (page: number) => {
      setStockCurrentPage(page);
    };

    // watch와 setValue 함수를 메모이제이션
    const memoizedWatch = useCallback(
      (
        name:
          | keyof LocationFormModel
          | `locations.${number}`
          | `locations.${number}.id`
          | `locations.${number}.location`
          | `locations.${number}.images`
          | `locations.${number}.images.${number}`
      ) => watch(name),
      [watch]
    );
    const memoizedSetValue = useCallback(
      (
        name:
          | keyof LocationFormModel
          | `locations.${number}`
          | `locations.${number}.id`
          | `locations.${number}.location`
          | `locations.${number}.images`
          | `locations.${number}.images.${number}`,
        value:
          | string
          | number
          | {
              id?: number | undefined;
              location: string;
              images: (string | File)[];
            }
          | {
              id?: number | undefined;
              location: string;
              images: (string | File)[];
            }[]
          | File
          | (string | File)[]
          | undefined,
        options?: { shouldDirty?: boolean }
      ) => setValue(name, value, options),
      [setValue]
    );

    useImperativeHandle(
      ref,
      () => ({
        getValues: () =>
          materialInfoRef.current?.getValues() ?? {
            materialType: '',
            materialName: '',
            materialCode: '',
            size: '',
            unit: '',
            stockUnit: '',
            safeStock: '',
            unitWeight: '',
            expirationDate: '',
            memo: '',
            currentStock: '',
            minStock: '',
          },
        isDirty: isDirtyMaterialInfo,
        // 추가: 위치 정보 관련 메서드도 함께 노출
        getLocationValues: () =>
          getLocationValues('locations' as keyof LocationFormModel),
        isLocationDirty: isRhfDirty,
        resetLocations: (locations: LocationFormModel['locations']) =>
          reset({ locations }),
        // 이미지 업로드를 위한 메서드들
        watch: memoizedWatch,
        setValue: memoizedSetValue,
        // ProductRequiringMaterial ref 노출
        productRequiringMaterialRef,
        // SubMaterials ref 노출
        subMaterialsRef,
      }),
      [
        getLocationValues,
        isRhfDirty,
        reset,
        isDirtyMaterialInfo,
        memoizedWatch,
        memoizedSetValue,
        productRequiringMaterialRef,
        subMaterialsRef,
      ]
    );

    useEffect(() => {
      if (locations) {
        reset({ locations });
      }
    }, [locations, reset]);

    // 클라이언트가 수정되어 저장되었을 때 업체별 단가 비교 재조회
    useEffect(() => {
      if (clientWasModified && materialId) {
        refetchPriceHistory();
      }
    }, [clientWasModified, materialId, refetchPriceHistory]);

    // 제품이 연결/삭제되었을 때 ProductRequiringMaterial 재렌더링
    useEffect(() => {
      if (productWasModified) {
        // ref를 통해 refresh 메서드 호출
        if (productRequiringMaterialRef.current?.refresh) {
          productRequiringMaterialRef.current.refresh();
        }
      }
    }, [productWasModified]);

    return (
      <>
        <div className="flex flex-col gap-10">
          {/* 원자재 정보 */}
          <div className="flex flex-col gap-3">
            <h3 className="Heading-3 text-dg h-10 flex items-center">
              원자재 정보
            </h3>
            <MaterialInfo
              materialId={materialId}
              ref={materialInfoRef}
              onIsDirtyChange={setIsDirtyMaterialInfo}
            />
          </div>

          {/* 원자재가 보관된 창고 위치 */}
          <div className="flex flex-col gap-3">
            <div className="h-10 flex items-center justify-between">
              <h3 className="Heading-3 h-10 flex items-center text-dg">
                원자재가 보관된 창고 위치
              </h3>
              <MiniBtn
                text="추가"
                textColor="text-dg"
                borderColor="border-lg"
                hoverColor="hover:bg-bg"
                onClick={() => setIsUploadModalOpen(true)}
                disabled={isViewer || !hasSubscription()}
              />
            </div>

            <StockLocation
              control={control}
              fields={fields}
              remove={remove}
              setValue={setValue}
              watch={watch}
              onLocationClick={onLocationClick}
              locations={locations}
              onDeleteLocation={onDeleteLocation}
              isLoading={isLocationLoading}
            />
          </div>

          {/* 이 자재가 사용된 제품 */}
          <ProductRequiringMaterial
            ref={productRequiringMaterialRef}
            materialId={materialId}
            handleOpenDeleteModal={handleOpenDeleteModal}
            setIsProductEnrollmentModalOpen={setIsProductEnrollmentModalOpen}
            onProductClick={(productId) => {
              // 제품 디테일 패널 열기 로직
              if (onProductClick) {
                onProductClick(productId);
              }
            }}
          />

          {/* 대체 가능한 원자재 */}
          <SubMaterials
            ref={subMaterialsRef}
            materialId={materialId}
            setIsCreateSubstituteModalOpen={setIsCreateSubstituteModalOpen}
            handleOpenDeleteSubstituteModal={handleOpenDeleteSubstituteModal}
          />

          {/* 업체별 단가 비교 */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 items-center">
              <h3 className="Heading-3 text-dg h-10 flex items-center">
                업체별 단가 비교
              </h3>
            </div>

            <QuotationHistory
              setIsClinetDetailPanelOpen={setIsClinetDetailPanelOpen}
              histories={priceHistories?.data}
              isLoading={priceHistories === null}
              currentPage={priceCurrentPage}
              totalPages={priceHistories?.pageCnt || 1}
              onPageChange={handlePricePageChange}
            />
          </div>

          {/* 원자재 입고 및 LOT 추적 */}
          <MaterialStockIn
            materialId={materialId}
            setIsMaterialPackagingDetailModalOpen={() =>
              setIsMaterialPackagingDetailModalOpen('create')
            }
          />

          {/* 원자재 소분 내역 */}
          <MaterialPackaging
            setIsMaterialPackagingDetailModalOpen={() =>
              setIsMaterialPackagingDetailModalOpen('update')
            }
          />

          {/* 원자재 사용 내역 */}
          <MaterialStockOut />

          {/*  이 부분 확인해보기 */}
          {/* 원자재 입·출고 내역 */}
          <div className="flex flex-col gap-3">
            <h3 className="Heading-3 text-dg h-10 flex items-center">
              원자재 입고 및 사용 내역
            </h3>

            <MaterialStockLog
              histories={stockHistories?.data}
              isLoading={isStockLoading}
              currentPage={stockCurrentPage}
              totalPages={stockHistories?.pageCnt || 1}
              onPageChange={handleStockPageChange}
            />
          </div>
        </div>
      </>
    );
  }
);

MaterialDetail.displayName = 'MaterialDetail';

export default MaterialDetail;
