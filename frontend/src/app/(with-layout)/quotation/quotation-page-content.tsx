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
import EmailView from './modals/email-view';
import OverlayView from '@/ui/ovelay-view';
import PrintView from './modals/print-view';
import StartProductionModal from './modals/start-production-modal';
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
  useToast,
} from '@/hooks';
import { useSearchParams } from 'next/navigation';
import useFactoryStore from '@/store/factory-store';
import useOcrStore from '@/store/ocr-store';

// Extend ClientModel for quotation form to include due_date
interface QuotationFormModel extends ClientModel {
  due_date: string;
}
import TabArea from './tab-area';
import { useForm } from 'react-hook-form';
import TitleSec from './title-sec';
import InputSection from './input-section';
import Toast from '@/ui/toast';

const QuotationPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quotationId = searchParams.get('quotation_id')
    ? parseInt(searchParams.get('quotation_id') || '0')
    : undefined;
  const projectId = searchParams.get('project_id')
    ? parseInt(searchParams.get('project_id') || '0')
    : undefined;

  const { saveDraft } = useSaveDraftQuotation();
  const { startProduction, error } = useStartProduction();
  const { getProjectStatus } = useGetProjectStatus();
  const { updateProjectStatus } = useUpdateProjectStatus();
  const { data: quotationData, isLoading: isQuotationLoading } =
    useGetDetailQuotation(quotationId || 0);
  const factoryId = useFactoryStore((state) => state.factoryId);
  const { showToast, isToastOpen, isVisible } = useToast(3000);
  const { ocrData, imageUrl, setOcrData } = useOcrStore();

  // 프로젝트 상태 로드
  const loadProjectStatus = useCallback(async () => {
    if (!projectId) return;

    try {
      const result = await getProjectStatus(projectId);
      if (result.success && result.data) {
        setProjectStatus(result.data.status);
      }
    } catch {}
  }, [getProjectStatus, projectId]);

  // 컴포넌트 마운트 시 프로젝트 상태 로드
  useEffect(() => {
    loadProjectStatus();

    // 컴포넌트 언마운트 시 Zustand store 정보 초기화
    return () => {
      // OCR 데이터 초기화
      useOcrStore.getState().clearOcrData();
    };
  }, [loadProjectStatus]);

  // 프로젝트 상태 변경
  const handleProjectStatusChange = useCallback(
    async (newStatus: string) => {
      if (!projectId) return;

      try {
        const result = await updateProjectStatus(projectId, newStatus);
        if (result.success) {
          setProjectStatus(newStatus);
        }
      } catch {}
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
          (product) =>
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

  // 탭 상태 - ocr데이터가 없으면 히스토리 탭이 활성화
  const [activeTab, setActiveTab] = useState<'quotation' | 'history'>(
    imageUrl ? 'quotation' : 'history'
  );

  // OCR 데이터가 있을 때 폼에 자동으로 설정
  useEffect(() => {
    if (ocrData && (!quotationData || !quotationData.factory_name)) {
      // OCR 데이터를 store에 저장 (백업)
      setOcrData(ocrData, imageUrl || '');

      // factoryname이 비어있으면 ocrdata로 폼 채우기 // factoryname이 비어있으면 저장 안됨
      // OCR 데이터로 폼 자동 채우기
      setValue('name', ocrData.client_info.company_name || '');
      setValue(
        'business_registration_number',
        ocrData.client_info.registration_number || ''
      );
      setValue('representative_name', ocrData.client_info.ceo_name || '');
      setValue('business_type', ocrData.client_info.business_type || '');
      setValue('business_category', ocrData.client_info.category || '');
      setValue('address', ocrData.client_info.address || '');
      setValue('email', ocrData.client_info.email || '');
      setValue('phone', ocrData.client_info.call_number || '');
      setValue('fax', ocrData.client_info.fax_number || '');
      setValue('manager', ocrData.client_info.manager_name || '');
      setValue('due_date', ocrData.client_info.delivery_date || '');

      // OCR 데이터에서 품목 정보 추출하여 quotationProducts 설정
      if (
        (ocrData as OcrDataModel).request_items &&
        (ocrData as OcrDataModel).request_items.length > 0
      ) {
        const extractedProducts = (ocrData as OcrDataModel).request_items.map(
          (product: OcrRequestItemModel) => ({
            productId: null, // OCR에서는 productId가 없으므로 null
            product_code: product.item_code || '',
            product_name: product.item_name || '',
            spec: product.spec || '',
            unit: product.unit || '',
            quantity: product.quantity ? Number(product.quantity) : null,
            unit_price: product.unit_price ? Number(product.unit_price) : null,
            supply_amount: null, // 공급가액은 나중에 계산
            tax_amount: null, // 세액은 나중에 계산
          })
        );

        setQuotationProducts(extractedProducts);
        setInitialQuotationProducts(extractedProducts);

        // 품목이 있으면 hasQuotationProducts를 true로 설정
        const hasValidProducts = extractedProducts.every(
          (product: QuotationProductDetailResponseModel) =>
            product.product_name &&
            product.product_code &&
            product.spec &&
            product.unit &&
            product.quantity &&
            product.unit_price
        );
        setHasQuotationProducts(hasValidProducts);
      }

      // OCR 데이터가 있으면 견적서 탭 활성화
      setActiveTab('quotation');
    }
  }, [ocrData, quotationData, setValue, setActiveTab]);

  // OCR 데이터 변경 시 폼 초기화 함수
  const handleOcrDataChange = useCallback(
    (newOcrData: any) => {
      // 새로운 OCR 데이터로 폼 초기화
      setValue('name', newOcrData.client_info.company_name || '');
      setValue(
        'business_registration_number',
        newOcrData.client_info.registration_number || ''
      );
      setValue('representative_name', newOcrData.client_info.ceo_name || '');
      setValue('business_type', newOcrData.client_info.business_type || '');
      setValue('business_category', newOcrData.client_info.category || '');
      setValue('address', newOcrData.client_info.address || '');
      setValue('email', newOcrData.client_info.email || '');
      setValue('phone', newOcrData.client_info.call_number || '');
      setValue('fax', newOcrData.client_info.fax_number || '');
      setValue('manager', newOcrData.client_info.manager_name || '');
      setValue('due_date', newOcrData.client_info.delivery_date || '');

      // OCR 데이터에서 품목 정보 추출하여 quotationProducts 설정
      if (newOcrData.products && newOcrData.products.length > 0) {
        const extractedProducts = newOcrData.products.map(
          (product: OcrRequestItemModel) => ({
            productId: null, // OCR에서는 productId가 없으므로 null
            product_code: product.item_code || '',
            product_name: product.item_name || '',
            spec: product.spec || '',
            unit: product.unit || '',
            quantity: product.quantity ? Number(product.quantity) : 0,
            unit_price: product.unit_price ? Number(product.unit_price) : 0,
            supply_amount: null, // 공급가액은 나중에 계산
            tax_amount: null, // 세액은 나중에 계산
          })
        );

        setQuotationProducts(extractedProducts);
        setInitialQuotationProducts(extractedProducts);

        // 품목이 있으면 hasQuotationProducts를 true로 설정
        const hasValidProducts = extractedProducts.every(
          (product: QuotationProductDetailResponseModel) =>
            product.product_name &&
            product.product_code &&
            product.spec &&
            product.unit &&
            product.quantity &&
            product.unit_price
        );
        setHasQuotationProducts(hasValidProducts);
      }

      // 견적서 탭 활성화
      setActiveTab('quotation');

      // 폼 변경 상태 초기화
      reset();
    },
    [setValue, setActiveTab, reset]
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

  // 임시 저장 버튼 핸들러
  const handleSaveDraft = useCallback(async () => {
    try {
      const formData = watch();

      if (!factoryId) {
        throw new Error('공장 정보가 없습니다.');
      }

      const draftData = {
        quotation_id: quotationId || 0,
        client: {
          factory_id: factoryId,
          client_id: selectedClientId,
          name: formData.name,
          business_registration_number: formData.business_registration_number,
          representative_name: formData.representative_name,
          email: formData.email,
          phone: formData.phone,
          fax: formData.fax,
          business_type: formData.business_type,
          business_category: formData.business_category,
          address: formData.address,
          manager: formData.manager,
          note: formData.note,
          client_type: 'customer',
        },
        due_date: formData.due_date,
        products: quotationProducts.map((product) => ({
          product_id: product.productId || 0,
          quantity: product.quantity || 0,
          unit_price: product.unit_price || 0,
          is_delivery: false,
          delivery_date: null,
        })),
      };

      await saveDraft(draftData);
      // 폼의 isDirty 상태 초기화 - 현재 값으로 reset하여 변경사항 없음으로 표시
      reset(formData);
      // 견적 품목 변경 추적 초기화
      setInitialQuotationProducts([...quotationProducts]);

      // 임시저장 성공 시 프로젝트 페이지로 이동
      router.push('/project/process');
    } catch (error) {
      alert(
        '임시저장에 실패했습니다: ' +
          (error instanceof Error ? error.message : '알 수 없는 오류')
      );
    }
  }, [saveDraft, watch, quotationId, quotationProducts, factoryId, reset]);

  // 생산 시작 버튼 핸들러
  const handleStartProduction = useCallback(async () => {
    try {
      const formData = watch();

      if (!factoryId) {
        throw new Error('공장 정보가 없습니다.');
      }

      // 주문확정 시에는 모든 품목이 완전해야 함
      const incompleteProducts = quotationProducts.filter(
        (product) =>
          !product.productId || !product.quantity || !product.unit_price
      );

      if (incompleteProducts.length > 0) {
        alert(
          '주문확정을 위해서는 모든 품목의 수량과 단가가 입력되어야 합니다.'
        );
        return;
      }

      const productionData = {
        quotation_id: quotationId || 0,
        client: {
          factory_id: factoryId,
          client_id: selectedClientId,
          name: formData.name,
          business_registration_number: formData.business_registration_number,
          representative_name: formData.representative_name,
          email: formData.email,
          phone: formData.phone,
          fax: formData.fax,
          business_type: formData.business_type,
          business_category: formData.business_category,
          address: formData.address,
          manager: formData.manager,
          note: formData.note,
        },
        due_date: formData.due_date,
        products: quotationProducts.map((product) => ({
          product_id: product.productId as number,
          quantity: product.quantity as number,
          unit_price: product.unit_price as number,
          is_delivery: false,
          delivery_date: null,
        })),
      };

      const result = await startProduction(productionData);

      // 에러가 발생한 경우 (null 반환)
      if (!result) {
        // useStartProduction의 error 상태를 확인
        const currentError = error;

        let toastText = currentError || '생산 시작에 실패했습니다.';
        let toastSubtext = '다시 시도해 주세요.';

        if (toastText.includes('해당 공장에 가동 가능한 설비가 없습니다')) {
          toastText = '가동 가능한 설비가 없습니다.';
          toastSubtext = '설비 등록 후 생산을 다시 시작해 주세요.';
        }

        setToastText(toastText);
        setToastSubtext(toastSubtext);
        showToast();
        return;
      }

      // 성공 시 모달 닫고
      setIsStartProductionModalOpen(false);
      //프로젝트 페이지로 이동
      if (result.project_id) {
        router.push(`/production/${result.project_id}`);
      }
    } catch (error) {
      // 에러 메시지 추출
      let errorText = '생산 시작에 실패했습니다.';
      let errorSubtext = '다시 시도해 주세요.';

      if (error instanceof Error) {
        errorText = error.message;

        // 특정 에러 메시지에 따른 처리
        if (errorText.includes('해당 공장에 가동 가능한 설비가 없습니다')) {
          errorText = '가동 가능한 설비가 없습니다.';
          errorSubtext = '설비 등록 후 생산을 다시 시작해 주세요.';
        } else if (errorText.includes('설비 조회 중 오류가 발생했습니다')) {
          errorText = '설비 조회 중 오류가 발생했습니다.';
          errorSubtext = '다시 시도해 주세요.';
        }
      }

      // 에러 토스트 표시
      setToastText(errorText);
      setToastSubtext(errorSubtext);
      showToast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startProduction, watch, quotationId, quotationProducts]);

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
            ) : ocrData ? (
              <PreviewImage
                isOrderStatus={isOrderStatus}
                imageUrl={imageUrl}
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
