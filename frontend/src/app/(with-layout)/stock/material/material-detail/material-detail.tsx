import MiniBtn from '@/ui/mini-btn';
import MaterialInfo, { MaterialInfoModel } from './material-info';
import ProductRequiringMaterial from './product-requiring-material';
import QuotationHistory from './quotation-history.tsx';
import MaterialStockLog from './material-stock-log';
import StockLocation from '../../stock-location';
import NoHistoryBox from '@/ui/no-history-box';
import { CaretDown } from '@phosphor-icons/react';
import SelectPeriodDropdown from '@/ui/dropdown/select-period-dropdown/select-period-dropdown';
import {
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { usePeriodSelector } from '@/hooks/use-period-selector';
import { ProductRequiringMaterialRefModel } from './product-requiring-material';
import CustomDateSelector from '@/ui/dropdown/select-period-dropdown/custom-date-selector';
import { useGetMaterialHistory, useGetMaterialHistoryDetail } from '@/hooks';
import useFactoryStore from '@/store/factory-store';

export type { MaterialInfoModel } from './material-info';

interface MaterialDetailProps {
  materialId: number;
  setIsProductEnrollmentModalOpen: (v: boolean) => void;
  handleOpenUploadModal: (index: number) => void;
  onIsDirtyChange?: (isDirty: boolean) => void;
  locations?: LocationFormModel['locations'];
  setIsClinetDetailPanelOpen: (clientId: number) => void;
  handleOpenDeleteModal: (connectionId: number) => void;
  onProductClick?: (productId: number) => void;
}

interface LocationFormModel {
  locations: {
    id?: number;
    location: string;
    images: (string | File)[];
  }[];
}

const MaterialDetail = forwardRef<MaterialInfoModel, MaterialDetailProps>(
  (
    {
      materialId,
      setIsProductEnrollmentModalOpen,
      handleOpenUploadModal,
      onIsDirtyChange,
      locations,
      setIsClinetDetailPanelOpen,
      handleOpenDeleteModal,
      onProductClick,
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
    const { fields, append, remove } = useFieldArray({
      control,
      name: 'locations',
    });

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

    // 기간 선택 드롭다운 상태
    const [isPricePeriodDropdownOpen, setIsPricePeriodDropdownOpen] =
      useState(false);
    const [isStockLogPeriodDropdownOpen, setIsStockLogPeriodDropdownOpen] =
      useState(false);

    // 원자재 히스토리 조회 훅
    const { getMaterialHistory, histories: priceHistories } =
      useGetMaterialHistory();

    // 재고 이력 조회 훅
    const {
      getMaterialHistoryDetail,
      histories: stockHistories,
      isLoading: isStockLoading,
    } = useGetMaterialHistoryDetail();

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    // 업체별 단가 비교 기간 선택 훅
    const pricePeriodSelector = usePeriodSelector({
      materialId,
      page: currentPage,
      pageSize,
      onPeriodChange: async (filters) => {
        if (materialId) {
          await getMaterialHistory(materialId, {
            start_date: filters.start_date as string | undefined,
            end_date: filters.end_date as string | undefined,
            page: filters.page as number,
            page_size: pageSize,
          });
        }
      },
    });

    // 재고 이력 기간 선택 훅
    const stockLogPeriodSelector = usePeriodSelector({
      materialId,
      page: currentPage,
      pageSize,
      onPeriodChange: async (filters) => {
        if (materialId) {
          await getMaterialHistoryDetail(materialId, {
            start_date: filters.start_date as string | undefined,
            end_date: filters.end_date as string | undefined,
            page: filters.page as number,
            size: pageSize,
          });
        }
      },
    });

    // 페이지 변경 핸들러
    const handlePageChange = (page: number) => {
      setCurrentPage(page);
      // 페이지 변경 시에도 API 호출
      if (materialId) {
        getMaterialHistory(materialId, {
          page,
          page_size: pageSize,
        });
      }
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
            materialName: '',
            materialCode: '',
            size: '',
            unit: '',
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
      }),
      [
        getLocationValues,
        isRhfDirty,
        reset,
        isDirtyMaterialInfo,
        memoizedWatch,
        memoizedSetValue,
        productRequiringMaterialRef,
      ]
    );

    useEffect(() => {
      if (locations) {
        reset({ locations });
      }
    }, [locations, reset]);

    // StockLocationItem 추가 함수
    const handleAddStockLocation = () => {
      append({ location: '', images: [] });
    };

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
                onClick={handleAddStockLocation}
              />
            </div>
            {fields.length === 0 ? (
              <NoHistoryBox
                title="등록된 창고 위치가 아직 없어요."
                text="[추가] 버튼을 눌러 원자재가 보관된 창고를 등록해보세요."
              />
            ) : (
              <StockLocation
                control={control}
                fields={fields}
                remove={remove}
                setValue={setValue}
                watch={watch}
                openUploadModal={handleOpenUploadModal}
              />
            )}
          </div>

          {/* 업체별 단가 비교 */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 items-center">
              <h3 className="Heading-3 text-dg h-10 flex items-center">
                업체별 단가 비교
              </h3>
              {/* 기간 선택 */}
              <div className="relative">
                <MiniBtn
                  text={pricePeriodSelector.selectedPeriod}
                  textColor="text-dg"
                  borderColor="border-lg"
                  hoverColor="hover:bg-bg"
                  icon={CaretDown}
                  iconPosition="right"
                  onClick={() => setIsPricePeriodDropdownOpen(true)}
                  height="h-9"
                />
                {isPricePeriodDropdownOpen && (
                  <div className="absolute top-12 right-0 z-10 pb-5">
                    <SelectPeriodDropdown
                      onClose={() => setIsPricePeriodDropdownOpen(false)}
                      onSelect={(value) => {
                        pricePeriodSelector.handlePeriodChange(
                          value as
                            | '1개월'
                            | '3개월'
                            | '6개월'
                            | '1년'
                            | '직접 설정'
                        );
                        setIsPricePeriodDropdownOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>
              {pricePeriodSelector.selectedPeriod === '직접 설정' && (
                <CustomDateSelector
                  customStartDate={pricePeriodSelector.customStartDate}
                  customEndDate={pricePeriodSelector.customEndDate}
                  onStartDateChange={pricePeriodSelector.handleStartDateChange}
                  onEndDateChange={pricePeriodSelector.handleEndDateChange}
                  onDateAutoHyphen={pricePeriodSelector.handleDateAutoHyphen}
                  onCustomDateKeyDown={
                    pricePeriodSelector.handleCustomDateKeyDown
                  }
                />
              )}
            </div>

            <QuotationHistory
              setIsClinetDetailPanelOpen={setIsClinetDetailPanelOpen}
              histories={priceHistories?.data}
              isLoading={priceHistories === null}
              currentPage={currentPage}
              totalPages={priceHistories?.pageCnt || 1}
              onPageChange={handlePageChange}
            />
          </div>

          {/* 원자재가 연결된 품목 */}
          <div className="flex flex-col gap-3">
            <div className="h-10 flex items-center justify-between">
              <h3 className="Heading-3 text-dg">원자재가 연결된 품목</h3>
              <MiniBtn
                text="품목 연결"
                textColor="text-dg"
                borderColor="border-lg"
                hoverColor="hover:bg-bg"
                onClick={() => setIsProductEnrollmentModalOpen(true)}
              />
            </div>
            <ProductRequiringMaterial
              ref={productRequiringMaterialRef}
              materialId={materialId}
              handleOpenDeleteModal={handleOpenDeleteModal}
              onProductClick={(productId) => {
                // 품목 디테일 패널 열기 로직
                if (onProductClick) {
                  onProductClick(productId);
                }
              }}
            />
          </div>

          {/* 원자재 입·출고 내역 */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 items-center">
              <h3 className="Heading-3 text-dg h-10 flex items-center">
                원자재 입·출고 내역
              </h3>

              {/* 기간 선택 */}
              <div className="relative">
                <MiniBtn
                  text={stockLogPeriodSelector.selectedPeriod}
                  textColor="text-dg"
                  borderColor="border-lg"
                  hoverColor="hover:bg-bg"
                  icon={CaretDown}
                  iconPosition="right"
                  onClick={() => setIsStockLogPeriodDropdownOpen(true)}
                  height="h-9"
                />
                {isStockLogPeriodDropdownOpen && (
                  <div className="absolute top-12 right-0 z-10 pb-5">
                    <SelectPeriodDropdown
                      onClose={() => setIsStockLogPeriodDropdownOpen(false)}
                      onSelect={(value) => {
                        stockLogPeriodSelector.handlePeriodChange(
                          value as
                            | '1개월'
                            | '3개월'
                            | '6개월'
                            | '1년'
                            | '직접 설정'
                        );
                        setIsStockLogPeriodDropdownOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>
              {stockLogPeriodSelector.selectedPeriod === '직접 설정' && (
                <CustomDateSelector
                  customStartDate={stockLogPeriodSelector.customStartDate}
                  customEndDate={stockLogPeriodSelector.customEndDate}
                  onStartDateChange={
                    stockLogPeriodSelector.handleStartDateChange
                  }
                  onEndDateChange={stockLogPeriodSelector.handleEndDateChange}
                  onDateAutoHyphen={stockLogPeriodSelector.handleDateAutoHyphen}
                  onCustomDateKeyDown={
                    stockLogPeriodSelector.handleCustomDateKeyDown
                  }
                />
              )}
            </div>

            <MaterialStockLog
              // startDate={
              //   stockLogPeriodSelector.selectedPeriod === '직접 설정'
              //     ? stockLogPeriodSelector.customStartDate
              //     : (stockLogPeriodSelector.createFilters(
              //         stockLogPeriodSelector.selectedPeriod
              //       ).start_date as string)
              // }
              // endDate={
              //   stockLogPeriodSelector.selectedPeriod === '직접 설정'
              //     ? stockLogPeriodSelector.customEndDate
              //     : (stockLogPeriodSelector.createFilters(
              //         stockLogPeriodSelector.selectedPeriod
              //       ).end_date as string)
              // }
              histories={stockHistories?.data}
              isLoading={isStockLoading}
              currentPage={currentPage}
              totalPages={stockHistories?.pageCnt || 1}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </>
    );
  }
);

MaterialDetail.displayName = 'MaterialDetail';

export default MaterialDetail;
