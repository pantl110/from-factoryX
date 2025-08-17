'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLineLeftIcon,
  ArrowLineRightIcon,
  CheckCircleIcon,
} from '@phosphor-icons/react/dist/ssr';
import RequestInfo from './request-info';
import PreviewImage from './image-preview';
import History from './history';
import OverlayView from '@/ui/ovelay-view';
import {
  ClientModel,
  OcrDataModel,
  OcrRequestItemModel,
  QuotationProductDetailResponseModel,
  QuotationResponseModel,
} from '@/types/data-model';
import {
  useStartProduction,
  useSaveDraftQuotation,
  useGetProjectStatus,
  useUpdateProjectStatus,
  useGetDetailQuotation,
  useGetClient,
  useGetProduct,
  useToast,
} from '@/hooks';
import { useSearchParams } from 'next/navigation';
import useFactoryStore from '@/store/factory-store';
import useOcrStore from '@/store/ocr-store';

import TabArea from './tab-area';
import { useForm } from 'react-hook-form';
import TitleSec from './title-sec';
import InputSection from './input-section';
import Toast from '@/ui/toast';
import PrintView from './modals/print-view';
import EmailView from './modals/email-view';
import StartProductionModal from './modals/start-production-modal';
import { useQuotationHandlers } from './handlers/quotation-handlers';
import { QuotationFormModel } from '@/types/data-model';

const QuotationPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const factoryId = useFactoryStore((state) => state.factoryId);
  const quotationId = searchParams.get('quotation_id')
    ? parseInt(searchParams.get('quotation_id') || '0')
    : undefined;
  const projectId = searchParams.get('project_id')
    ? parseInt(searchParams.get('project_id') || '0')
    : undefined;

  const { saveDraft } = useSaveDraftQuotation();
  const { startProduction } = useStartProduction();
  const { getProjectStatus } = useGetProjectStatus();
  const { updateProjectStatus } = useUpdateProjectStatus();
  const { data: quotationData, isLoading: isQuotationLoading } =
    useGetDetailQuotation(quotationId || 0);
  const { showToast, isToastOpen, isVisible } = useToast();
  const { ocrData, imageUrl, setOcrData } = useOcrStore();

  // 거래처 목록 가져오기
  const { clientList, getClients } = useGetClient();
  // 제품 목록 가져오기
  const { productList, getProductList } = useGetProduct();

  // 프로젝트 상태 로드
  const loadProjectStatus = useCallback(async () => {
    if (!projectId) return;

    try {
      const result = await getProjectStatus(projectId);
      if (result.success && result.data) {
        setProjectStatus(result.data.status);
      }
    } catch {
      // 프로젝트 상태 로드 실패 시 무시
    }
  }, [getProjectStatus, projectId]);

  // 컴포넌트 마운트 시 프로젝트 상태 로드
  useEffect(() => {
    loadProjectStatus();

    // 거래처 목록과 제품 목록 로드
    if (factoryId) {
      getClients();
      getProductList();
    }

    // 컴포넌트 언마운트 시 Zustand store 정보 초기화
    return () => {
      // OCR 데이터 초기화
      useOcrStore.getState().clearOcrData();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProjectStatus, factoryId]);

  // 프로젝트 상태 변경
  const handleProjectStatusChange = useCallback(
    async (newStatus: string) => {
      if (!projectId) return;

      try {
        const result = await updateProjectStatus(projectId, newStatus);
        if (result.success) {
          setProjectStatus(newStatus);
        }
      } catch {
        // 프로젝트 상태 업데이트 실패 시 무시
      }
    },
    [updateProjectStatus, projectId]
  );

  // 거래처 정보 폼
  const { setValue, control, trigger, watch, formState, reset } =
    useForm<QuotationFormModel>({
      mode: 'onChange',
      defaultValues: {
        factory_id: factoryId || 0,
        name: '',
        business_registration_number: '',
        representative_name: '',
        business_type: '',
        business_category: '',
        phone: '',
        fax: '',
        email: '',
        address: '',
        manager: '',
        note: '',
        due_date: '',
      },
    });

  // 견적서 데이터로 폼 기본값 설정
  const setFormValuesFromQuotation = useCallback(
    (quotation: QuotationResponseModel) => {
      // factory_id를 Zustand store에서 가져와서 설정
      setValue('factory_id', factoryId || 0);

      // 백엔드 응답 구조에 맞게 직접 접근
      setValue('name', quotation.factory_name || '');
      setValue(
        'business_registration_number',
        quotation.business_registration_number || ''
      );
      setValue('representative_name', quotation.representative_name || '');
      setValue('business_type', quotation.business_type || '');
      setValue('business_category', quotation.business_category || '');
      setValue('address', quotation.address || '');
      setValue('email', quotation.email || '');
      setValue('phone', quotation.phone || '');
      setValue('fax', quotation.fax || '');

      if (quotation?.due_date) {
        setValue('due_date', quotation.due_date);
      }
    },
    [setValue, factoryId]
  );

  // 견적서 데이터가 로드되면 폼에 설정
  useEffect(() => {
    if (quotationData && !isQuotationLoading) {
      setFormValuesFromQuotation(quotationData);
    }
  }, [quotationData, isQuotationLoading, setFormValuesFromQuotation]);

  // 견적 품목 초기값 설정 (변경 추적을 위해)
  useEffect(() => {
    if (quotationData && !isQuotationLoading) {
      // 기존 견적 품목이 있다면 초기값으로 설정
      if (quotationData.products && quotationData.products.length > 0) {
        const initialProducts = quotationData.products.map(
          (product: QuotationProductDetailResponseModel) => ({
            productId: product.productId,
            product_code: product.product_code || '',
            product_name: product.product_name || '',
            spec: product.spec || '',
            unit: product.unit || '',
            quantity: product.quantity || 0,
            unit_price: product.unit_price || 0,
            is_delivery: false,
            delivery_date: null,
          })
        );
        setInitialQuotationProducts(initialProducts);
        setQuotationProducts(initialProducts);

        // 초기 데이터 로드 시 hasQuotationProducts도 즉시 설정
        const hasValidInitialProducts = initialProducts.every(
          (product: QuotationProductDetailResponseModel) =>
            product.product_name &&
            product.product_code &&
            product.spec &&
            product.unit &&
            product.quantity &&
            product.unit_price
        );
        setHasQuotationProducts(hasValidInitialProducts);
      } else {
        // 품목이 없는 경우
        setHasQuotationProducts(false);
      }
    }
  }, [quotationData, isQuotationLoading]);

  // 프로젝트 상태 관리
  const [projectStatus, setProjectStatus] = useState<string | null>(null);

  // 선택된 거래처 ID 관리
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  // 견적서 & 주문서 상태 관리 (프로젝트 상태에 따라 결정)
  const isOrderStatus =
    projectStatus === 'confirmed' || projectStatus === '주문 확정';
  const isSuspendedStatus =
    projectStatus === 'suspended' || projectStatus === '중단';

  // 견적 품목 변경 추적을 위한 상태
  const [initialQuotationProducts, setInitialQuotationProducts] = useState<
    QuotationProductDetailResponseModel[]
  >([]);

  // 에러 표시 상태 (임시저장 시 유효성 검사 오류 표시용)
  const [showErrors, setShowErrors] = useState(false);

  // 탭 상태 - ocr데이터가 없으면 히스토리 탭이 활성화
  const [activeTab, setActiveTab] = useState<'quotation' | 'history'>(
    imageUrl ? 'quotation' : 'history'
  );

  // OCR 데이터가 있을 때 거래처 정보만 설정 (제품 정보는 request-info.tsx에서 처리)
  useEffect(() => {
    if (ocrData && (!quotationData || !quotationData.factory_name)) {
      // OCR 데이터를 store에 저장 (백업)
      setOcrData(ocrData, imageUrl || '');

      // 사업자등록번호로 기존 거래처 찾기
      const existingClient = clientList?.data?.find(
        (client) =>
          client.business_registration_number ===
          ocrData.client_info.registration_number
      );

      // 기존 거래처가 있으면 clientId 설정
      if (existingClient) {
        setSelectedClientId(existingClient.id);
      }

      // DB에 저장된 데이터를 우선으로 하고, 없는 값만 OCR 데이터로 채우기
      setValue(
        'name',
        existingClient?.name || ocrData.client_info.company_name || ''
      );
      setValue(
        'business_registration_number',
        existingClient?.business_registration_number ||
          ocrData.client_info.registration_number ||
          ''
      );
      setValue(
        'representative_name',
        existingClient?.representative_name ||
          ocrData.client_info.ceo_name ||
          ''
      );
      setValue(
        'business_type',
        existingClient?.business_type || ocrData.client_info.business_type || ''
      );
      setValue(
        'business_category',
        existingClient?.business_category || ocrData.client_info.category || ''
      );
      setValue(
        'address',
        existingClient?.address || ocrData.client_info.address || ''
      );
      setValue(
        'email',
        existingClient?.email || ocrData.client_info.email || ''
      );
      setValue(
        'phone',
        existingClient?.phone || ocrData.client_info.call_number || ''
      );
      setValue(
        'fax',
        existingClient?.fax || ocrData.client_info.fax_number || ''
      );
      setValue(
        'manager',
        existingClient?.manager || ocrData.client_info.manager_name || ''
      );
      setValue('due_date', ocrData.client_info.delivery_date || '');

      // OCR 데이터가 있으면 견적서 탭 활성화
      setActiveTab('quotation');
    }
  }, [
    ocrData,
    quotationData,
    setValue,
    setActiveTab,
    imageUrl,
    setOcrData,
    clientList,
  ]);

  // OCR 데이터 변경 시 폼 초기화 함수 (거래처 정보만 처리)
  const handleOcrDataChange = useCallback(
    (newOcrData: OcrDataModel) => {
      // 사업자등록번호로 기존 거래처 찾기
      const existingClient = clientList?.data?.find(
        (client) =>
          client.business_registration_number ===
          newOcrData.client_info.registration_number
      );

      // 기존 거래처가 있으면 clientId 설정
      if (existingClient) {
        setSelectedClientId(existingClient.id);
      }

      // DB에 저장된 데이터를 우선으로 하고, 없는 값만 OCR 데이터로 채우기
      setValue(
        'name',
        existingClient?.name || newOcrData.client_info.company_name || ''
      );
      setValue(
        'business_registration_number',
        existingClient?.business_registration_number ||
          newOcrData.client_info.registration_number ||
          ''
      );
      setValue(
        'representative_name',
        existingClient?.representative_name ||
          newOcrData.client_info.ceo_name ||
          ''
      );
      setValue(
        'business_type',
        existingClient?.business_type ||
          newOcrData.client_info.business_type ||
          ''
      );
      setValue(
        'business_category',
        existingClient?.business_category ||
          newOcrData.client_info.category ||
          ''
      );
      setValue(
        'address',
        existingClient?.address || newOcrData.client_info.address || ''
      );
      setValue(
        'email',
        existingClient?.email || newOcrData.client_info.email || ''
      );
      setValue(
        'phone',
        existingClient?.phone || newOcrData.client_info.call_number || ''
      );
      setValue(
        'fax',
        existingClient?.fax || newOcrData.client_info.fax_number || ''
      );
      setValue(
        'manager',
        existingClient?.manager || newOcrData.client_info.manager_name || ''
      );
      setValue('due_date', newOcrData.client_info.delivery_date || '');

      // 견적서 탭 활성화
      setActiveTab('quotation');

      // 폼 변경 상태 초기화
      reset();
    },
    [setValue, setActiveTab, reset, clientList]
  );

  // 오른쪽 패널 확장 상태
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(false);

  // 선택된 품목 상태 -> 히스토리 보여주기
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  // 모달 상태
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isStartProductionModalOpen, setIsStartProductionModalOpen] =
    useState(false);

  // 에러 토스트 상태
  const [toastText, setToastText] = useState<string>('');
  const [toastSubtext, setToastSubtext] = useState<string>('');

  // 요청 사항 목록에 따라 버튼 활성화 여부
  const [hasQuotationProducts, setHasQuotationProducts] = useState(false);
  // RequestInfo에서 받은 products 데이터
  const [quotationProducts, setQuotationProducts] = useState<
    QuotationProductDetailResponseModel[]
  >([]);

  // 견적 품목이 변경되었는지 확인하는 함수
  const hasQuotationProductsChanged = useMemo(() => {
    if (initialQuotationProducts.length !== quotationProducts.length) {
      return true;
    }

    return initialQuotationProducts.some((initialProduct, index) => {
      const currentProduct = quotationProducts[index];
      if (!currentProduct) return true;

      return (
        initialProduct.productId !== currentProduct.productId ||
        initialProduct.quantity !== currentProduct.quantity ||
        initialProduct.unit_price !== currentProduct.unit_price
      );
    });
  }, [initialQuotationProducts, quotationProducts]);

  // 통합된 isDirty 상태 (폼 변경 + 견적 품목 변경)
  const isDirty = formState.isDirty || hasQuotationProductsChanged;

  const handleProductClick = useCallback(
    (productId: number) => {
      setSelectedProduct(productId);
      setActiveTab('history'); // 품목 클릭 시 히스토리탭 활성화
      setIsRightPanelExpanded(false); // 히스토리탭 활성화 시 오른쪽 패널 다시 축소
    },
    [setIsRightPanelExpanded]
  );

  const activateQuotationTab = useCallback(() => {
    setSelectedProduct(null);
    setActiveTab('quotation'); // 견적요청서탭 활성화
    setIsRightPanelExpanded(false); // 견적요청서탭 활성화 시 오른쪽 패널 다시 축소

    // 현재 폼 값을 유지하면서 reset (변경 추적을 위해)
    const currentValues = watch();
    reset(currentValues);
  }, [setIsRightPanelExpanded, watch, reset]);

  // 패널 토글 함수
  const toggleRightPanel = () => {
    setIsRightPanelExpanded((prev) => !prev);
  };

  // 견적서 핸들러 훅 사용 // 임시저장 // 생산시작 함수
  const { handleSaveDraft, handleStartProduction } = useQuotationHandlers({
    watch,
    reset,
    quotationId,
    quotationProducts,
    factoryId,
    selectedClientId,
    imageUrl: imageUrl || undefined,
    saveDraft,
    startProduction,
    setInitialQuotationProducts,
    setShowErrors,
    setToastText,
    setToastSubtext,
    showToast,
    setIsStartProductionModalOpen,
    router,
  });

  // 폼 유효성 검사 - required 필드들이 모두 채워져 있는지 확인 (주문 확정용)
  const isFormValid = useMemo(() => {
    // 견적서 데이터가 아직 로드되지 않았으면 false 반환
    if (!quotationData || isQuotationLoading) {
      return false;
    }

    // 실시간으로 특정 필드들을 watch
    const name = watch('name') || '';
    const businessRegistrationNumber =
      watch('business_registration_number') || '';
    const representativeName = watch('representative_name') || '';
    const dueDate = watch('due_date') || '';
    const businessType = watch('business_type') || '';
    const businessCategory = watch('business_category') || '';
    const address = watch('address') || '';

    // required 필드들이 모두 채워져 있는지 확인
    const isAllRequiredFieldsFilled =
      name.trim() !== '' &&
      businessRegistrationNumber.trim() !== '' &&
      representativeName.trim() !== '' &&
      dueDate.trim() !== '' &&
      businessType.trim() !== '' &&
      businessCategory.trim() !== '' &&
      address.trim() !== '';

    return isAllRequiredFieldsFilled;
  }, [watch, quotationData, isQuotationLoading]);

  return (
    <>
      <div className="pt-7 pl-10 h-[calc(100vh-61px)] flex flex-col">
        <TitleSec
          setIsEmailOpen={setIsEmailOpen}
          setIsPrintOpen={setIsPrintOpen}
          setIsStartProductionModalOpen={setIsStartProductionModalOpen}
          trigger={trigger}
          watch={watch}
          formState={formState}
          isOrderStatus={isOrderStatus}
          setIsOrderStatus={() => handleProjectStatusChange('confirmed')}
          hasQuotationProducts={hasQuotationProducts}
          onSaveDraft={handleSaveDraft}
          isDirty={isDirty}
          isSuspendedStatus={isSuspendedStatus}
          setIsSuspendedStatus={() => handleProjectStatusChange('suspended')}
          projectId={projectId}
          isFormValid={isFormValid}
        />
        <TabArea
          isOrderStatus={isOrderStatus}
          activeTab={activeTab}
          activateQuotationTab={activateQuotationTab}
          ocrData={ocrData}
        />

        {/* 왼쪽 사진미리보기/히스토리 부분 */}
        <div className="flex flex-1 overflow-y-hidden">
          <div
            className={`
                ${isRightPanelExpanded ? 'hidden' : 'w-1/2 min-w-[50%]'}
                overflow-hidden border-r border-lg py-8 pr-10
              `}
          >
            {selectedProduct ? (
              <History selectedProduct={selectedProduct} />
            ) : ocrData || quotationData?.uploaded_file ? (
              <PreviewImage
                isOrderStatus={isOrderStatus}
                imageUrl={imageUrl || quotationData?.uploaded_file}
                onOcrDataChange={handleOcrDataChange}
              />
            ) : (
              <History selectedProduct={null} />
            )}
          </div>

          {/* 오른쪽 견적서 부분 */}
          <div
            className={`
                ${isRightPanelExpanded ? 'w-full' : 'w-1/2'}`}
          >
            <div
              className={`flex flex-col flex-1 pt-8 gap-11 pr-10
                ${isRightPanelExpanded ? 'pl-0' : 'pl-10'}`}
            >
              <div className="flex items-center gap-2 pb-3 border-b border-lg">
                <button
                  className="flex items-center justify-center w-10 h-10 cursor-pointer hover:bg-bg transition-colors rounded-lg duration-200"
                  onClick={toggleRightPanel}
                >
                  {isRightPanelExpanded ? (
                    <ArrowLineRightIcon size={20} className="text-dg" />
                  ) : (
                    <ArrowLineLeftIcon size={20} className="text-dg" />
                  )}
                </button>
                <h2 className="flex-1 Heading-2">
                  {isOrderStatus ? '주문서' : '견적서'}
                </h2>
              </div>
            </div>

            <div className="overflow-y-auto scrollbar-hide h-full pt-8">
              <div
                className={`flex flex-col flex-1 gap-5 pr-10 pb-11 ${
                  isRightPanelExpanded ? 'pl-0' : 'pl-10'
                }`}
              >
                <h3 className="Heading-3">거래처 정보</h3>
                <InputSection
                  control={control}
                  setValue={setValue}
                  errors={formState.errors}
                  onClientSelect={setSelectedClientId}
                  showErrors={showErrors}
                />
              </div>

              <div
                className={`flex flex-col gap-5 pb-8 pr-10 ${
                  isRightPanelExpanded ? 'pl-0' : 'pl-10'
                }`}
              >
                <RequestInfo
                  onProductClick={handleProductClick}
                  setHasQuotationProducts={setHasQuotationProducts}
                  onProductsChange={setQuotationProducts}
                  quotationId={quotationId}
                  ocrRequestData={
                    ocrData?.request_items as OcrRequestItemModel[]
                  }
                  productList={productList}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 출력하기 버튼 */}
      {isPrintOpen && (
        <OverlayView onClose={() => setIsPrintOpen(false)}>
          <PrintView
            documentTitle={isOrderStatus ? '주문서' : '견적서'}
            clientData={{
              factory_id: watch().factory_id,
              name: watch().name,
              business_registration_number:
                watch().business_registration_number,
              representative_name: watch().representative_name,
              email: watch().email,
              phone: watch().phone,
              fax: watch().fax,
              business_type: watch().business_type,
              business_category: watch().business_category,
              address: watch().address,
              manager: watch().manager,
              note: watch().note,
            }}
            dueDate={watch().due_date}
            productListInfoTitle={
              isOrderStatus ? '주문 품목 정보' : '견적 품목 정보'
            }
            productItems={quotationProducts}
            supplyAmount={quotationProducts.reduce((total, product) => {
              if (product.quantity && product.unit_price) {
                return total + product.quantity * product.unit_price;
              }
              return total;
            }, 0)}
            onClose={() => setIsPrintOpen(false)}
          />
        </OverlayView>
      )}
      {/* 이메일 보내기 버튼 */}
      {isEmailOpen && (
        <OverlayView onClose={() => setIsEmailOpen(false)}>
          <EmailView
            documentTitle={isOrderStatus ? '주문서' : '견적서'}
            clientData={{
              factory_id: watch().factory_id,
              name: watch().name,
              business_registration_number:
                watch().business_registration_number,
              representative_name: watch().representative_name,
              email: watch().email,
              phone: watch().phone,
              fax: watch().fax,
              business_type: watch().business_type,
              business_category: watch().business_category,
              address: watch().address,
              manager: watch().manager,
              note: watch().note,
            }}
            dueDate={watch().due_date}
            productListInfoTitle={
              isOrderStatus ? '주문 품목 정보' : '견적 품목 정보'
            }
            productItems={quotationProducts}
            supplyAmount={quotationProducts.reduce((total, product) => {
              if (product.quantity && product.unit_price) {
                return total + product.quantity * product.unit_price;
              }
              return total;
            }, 0)}
            onClose={() => setIsEmailOpen(false)}
          />
        </OverlayView>
      )}
      {/* 생산 시작하기 버튼 */}
      {isStartProductionModalOpen && (
        <StartProductionModal
          onClose={() => setIsStartProductionModalOpen(false)}
          onClick={handleStartProduction}
        />
      )}
      {/* 에러 토스트 */}
      {isToastOpen && (
        <Toast
          icon={<CheckCircleIcon size={20} className="text-red" />}
          text={toastText}
          subtext={toastSubtext}
          type="red"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default QuotationPageContent;
