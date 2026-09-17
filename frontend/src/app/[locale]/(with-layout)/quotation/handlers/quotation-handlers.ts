import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { UseFormWatch, UseFormReset, UseFormTrigger } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import {
  QuotationProductDetailResponseModel,
  ProductionDataModel,
  SaveDraftDataModel,
  QuotationFormModel,
} from '@/types/data-model';

interface StartProductionResponseModel {
  quotation_id: number;
  project_id: number;
  status: string;
}

interface QuotationHandlersProps {
  watch: UseFormWatch<QuotationFormModel>;
  reset: UseFormReset<QuotationFormModel>;
  trigger: UseFormTrigger<QuotationFormModel>;
  quotationId?: number;
  quotationProducts: QuotationProductDetailResponseModel[];
  factoryId: number | null;
  selectedClientId: number | null;
  imageUrl?: string;
  saveDraft: (data: SaveDraftDataModel) => Promise<{
    quotation_id: number;
    project_id?: number;
    client_id?: number;
    status: string;
  }>;
  startProduction: (
    data: ProductionDataModel
  ) => Promise<StartProductionResponseModel>;
  setInitialQuotationProducts: (
    products: QuotationProductDetailResponseModel[]
  ) => void;
  setShowErrors: (show: boolean) => void;
  toast: {
    setText: (text: string) => void;
    setSubtext: (subtext: string) => void;
    setType: (type: 'red' | 'primary') => void;
    show: () => void;
  };
  setIsStartProductionModalOpen: (open: boolean) => void;
  router: ReturnType<typeof useRouter>;
  createdQuotationId?: number | null;
  taxId?: number | null; // 세금계산서 ID
  linkTaxInvoice?: (params: {
    project_id: number;
    tax_id: number;
  }) => Promise<{ success: boolean }>; // 세금계산서 연결 함수
}

export const useQuotationHandlers = ({
  watch,
  reset,
  trigger,
  quotationId,
  quotationProducts,
  factoryId,
  selectedClientId,
  imageUrl,
  saveDraft,
  startProduction,
  setInitialQuotationProducts,
  setShowErrors,
  toast,
  setIsStartProductionModalOpen,
  router,
  createdQuotationId,
  taxId,
  linkTaxInvoice,
}: QuotationHandlersProps) => {
  const t = useTranslations('quotation.errors');
  const [isSaveDraftLoading, setIsSaveDraftLoading] = useState(false);
  const [isStartProductionLoading, setIsStartProductionLoading] =
    useState(false);

  // 임시 저장 버튼 & 주문 확정 버튼 핸들러
  const handleSaveDraft = useCallback(
    async (
      isConfirm: boolean
    ): Promise<{
      success: boolean;
      quotation_id?: number;
      client_id?: number;
    }> => {
      try {
        setIsSaveDraftLoading(true);
        const formData = watch();

        if (!factoryId) {
          throw new Error(t('factoryNotFound'));
        }

        // 주문확정일 때만 에러 표시 활성화
        if (isConfirm) {
          setShowErrors(true);
        }

        // 저장 전 유효성 검사.
        // 백엔드는 길이/형식을 검증하지 않고 그대로 INSERT하므로,
        // 컬럼 길이를 넘긴 값이 올라가면 DB에서 DataError(500)가 난다.
        //
        // 주문확정은 전체 필드를 검사하고,
        // 임시저장은 작성 중인 내용을 저장할 수 있어야 하므로 값이 있는 필드만 검사한다.
        // (빈 필드를 검사 대상에서 빼면 required는 걸리지 않고 형식·길이 위반만 남는다)
        const filledFields = (
          Object.keys(formData) as (keyof QuotationFormModel)[]
        ).filter((field) => {
          const value = formData[field];
          return typeof value === 'string'
            ? value.trim() !== ''
            : value !== null && value !== undefined;
        });

        const isFormValid = isConfirm
          ? await trigger()
          : filledFields.length === 0 || (await trigger(filledFields));

        if (!isFormValid) {
          // 어떤 필드가 문제인지는 각 입력 아래 메시지로 표시된다.
          setShowErrors(true);
          throw new Error(t('invalidFormValue'));
        }

        const draftData: SaveDraftDataModel = {
          quotation_id: quotationId || null,
          client: {
            factory_id: factoryId,
            client_id: selectedClientId || null,
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
            // is_customer, is_supplier는 백엔드에서 자동으로 설정됨
          },
          due_date: formData.due_date,
          products: quotationProducts.map((product) => ({
            product_id: product.productId || null,
            product_name: product.product_name,
            product_code: product.product_code,
            spec: product.spec,
            unit: product.unit,
            quantity: product.quantity || 0,
            unit_price: product.unit_price || 0,
            is_delivery: false,
            delivery_date: null,
          })),
          uploaded_file: imageUrl || undefined, // OCR 데이터의 imageUrl을 uploaded_file로 전달
          is_confirm: isConfirm, // 임시저장은 false 주문확정은 true
        };

        const result = await saveDraft(draftData);

        // 성공 시에만 처리
        if (result && result.quotation_id) {
          // 폼의 isDirty 상태 초기화 - 현재 값으로 reset하여 변경사항 없음으로 표시
          reset(formData);
          // 견적 제품 변경 추적 초기화
          setInitialQuotationProducts([...quotationProducts]);
          // 에러 표시 상태 초기화
          setShowErrors(false);
          return {
            success: true,
            quotation_id: result.quotation_id,
            client_id: result.client_id,
          };
        }
        return { success: false };
      } catch (error) {
        // 에러 메시지 설정
        const errorMessage =
          error instanceof Error ? error.message : t('unknownError');

        // 날짜 형식 에러인 경우 다른 토스트 메시지 표시
        if (errorMessage.includes(t('invalidDateFormat'))) {
          toast.setText(t('validDueDateRequired'));
          toast.setSubtext(t('dueDateFormat'));
        } else {
          toast.setText(t('saveDraftFailed'));
          toast.setSubtext(errorMessage);
        }

        toast.setType('red');
        toast.show();
        return { success: false };
      } finally {
        setIsSaveDraftLoading(false);
      }
    },
    [
      watch,
      reset,
      trigger,
      quotationId,
      quotationProducts,
      factoryId,
      selectedClientId,
      imageUrl,
      saveDraft,
      setInitialQuotationProducts,
      setShowErrors,
      toast,
      t,
    ]
  );

  // 생산 시작 버튼 핸들러 (startProduction API 사용)
  const handleStartProduction = useCallback(async () => {
    // selectedClientId를 기본값으로 두고, 흐름 중 확보되면 갱신
    let currentClientId: number | null = selectedClientId ?? null;
    let currentQuotationId = quotationId ?? createdQuotationId ?? undefined;

    try {
      setIsStartProductionLoading(true);
      const formData = watch();

      if (!factoryId) {
        throw new Error(t('factoryNotFound'));
      }

      // 주문확정 시에는 모든 제품이 완전해야 함
      const incompleteProducts = quotationProducts.filter(
        (product) =>
          !product.productId || !product.quantity || !product.unit_price
      );

      if (incompleteProducts.length > 0) {
        alert(t('allProductsRequired'));
        return;
      }

      // quotationId가 없으면 먼저 견적서를 생성
      if (!currentQuotationId) {
        const draftData: SaveDraftDataModel = {
          quotation_id: null,
          client: {
            factory_id: factoryId,
            client_id: selectedClientId || null,
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
            // is_customer, is_supplier는 백엔드에서 자동으로 설정됨
          },
          due_date: formData.due_date,
          products: quotationProducts.map((product) => ({
            product_id: product.productId || null,
            product_name: product.product_name,
            product_code: product.product_code,
            spec: product.spec,
            unit: product.unit,
            quantity: product.quantity || 0,
            unit_price: product.unit_price || 0,
            is_delivery: false,
            delivery_date: null,
          })),
          uploaded_file: imageUrl || undefined,
          is_confirm: true, // 먼저 주문확정으로 견적서 생성
        };

        const draftResult = await saveDraft(draftData);
        currentQuotationId = draftResult.quotation_id;
        currentClientId = draftResult.client_id ?? null;
      }

      // 이제 생산 시작
      const productionData: ProductionDataModel = {
        quotation_id: currentQuotationId,
        client: {
          factory_id: factoryId,
          client_id: currentClientId,
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
          // is_customer, is_supplier는 백엔드에서 자동으로 설정됨
        },
        due_date: formData.due_date,
        products: quotationProducts.map((product) => ({
          product_id: product.productId as number,
          product_name: product.product_name,
          product_code: product.product_code,
          spec: product.spec,
          unit: product.unit,
          quantity: product.quantity as number,
          unit_price: product.unit_price as number,
          is_delivery: false,
          delivery_date: null,
        })),
      };

      const result = await startProduction(productionData);

      // 에러가 발생한 경우 (null 반환)
      if (!result) {
        const toastText = t('startProductionFailed');
        const toastSubtext = t('startProductionFailedSubtext');

        // 실패 시 현재 주문서 내용을 주문확정 상태로 저장 (is_confirm: true)
        try {
          await saveDraft({
            quotation_id: currentQuotationId || null,
            client: {
              factory_id: factoryId,
              client_id: currentClientId,
              name: formData.name,
              business_registration_number:
                formData.business_registration_number,
              representative_name: formData.representative_name,
              email: formData.email,
              phone: formData.phone,
              fax: formData.fax,
              business_type: formData.business_type,
              business_category: formData.business_category,
              address: formData.address,
              manager: formData.manager,
              note: formData.note,
              // is_customer, is_supplier는 백엔드에서 자동으로 설정됨
            },
            due_date: formData.due_date,
            products: quotationProducts.map((product) => ({
              product_id: product.productId || null,
              product_name: product.product_name,
              product_code: product.product_code,
              spec: product.spec,
              unit: product.unit,
              quantity: product.quantity || 0,
              unit_price: product.unit_price || 0,
              is_delivery: false,
              delivery_date: null,
            })),
            uploaded_file: imageUrl || undefined,
            is_confirm: true,
          });
        } catch {
          // 임시저장도 실패 시 조용히 무시 (토스트는 생산 실패만 표시)
        }

        toast.setText(toastText);
        toast.setSubtext(toastSubtext);
        toast.setType('red');
        toast.show();
        return;
      }

      // 성공 시 모달 닫고
      setIsStartProductionModalOpen(false);

      // 프로젝트 생성 성공 후 세금계산서가 있으면 연결
      if (result && result.project_id && taxId && linkTaxInvoice) {
        try {
          await linkTaxInvoice({
            project_id: result.project_id,
            tax_id: taxId,
          });
        } catch {
          // 세금계산서 연결 실패는 조용히 무시 (프로젝트 생성은 성공했으므로)
        }
      }

      //프로젝트 페이지로 이동
      if (result && result.project_id) {
        router.push(`/production/${result.project_id}`);
      }
    } catch (error) {
      // 에러 메시지 추출
      let errorText = t('startProductionFailed');
      let errorSubtext = t('startProductionFailedSubtext');

      if (error instanceof Error) {
        errorText = error.message;

        // 특정 에러 메시지에 따른 처리
        if (errorText.includes(t('noAvailableEquipment'))) {
          errorText = t('noAvailableEquipment');
          errorSubtext = t('noAvailableEquipmentSubtext');
        } else if (errorText.includes(t('equipmentQueryError'))) {
          errorText = t('equipmentQueryError');
          errorSubtext = t('equipmentQueryErrorSubtext');
        } else if (errorText.includes(t('invalidDateFormat'))) {
          errorText = t('invalidDateFormatError');
          errorSubtext = t('invalidDateFormatSubtext');
        }
      }

      // 예외 발생 시에도 현재 주문서 내용을 주문확정 상태로 저장 (is_confirm: true)
      try {
        const formData = watch();
        await saveDraft({
          quotation_id: currentQuotationId || null,
          client: {
            factory_id: factoryId as number,
            client_id: currentClientId,
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
            // client_type, is_customer, is_supplier는 백엔드에서 자동으로 설정됨
          },
          due_date: formData.due_date,
          products: quotationProducts.map((product) => ({
            product_id: product.productId || null,
            product_name: product.product_name,
            product_code: product.product_code,
            spec: product.spec,
            unit: product.unit,
            quantity: product.quantity || 0,
            unit_price: product.unit_price || 0,
            is_delivery: false,
            delivery_date: null,
          })),
          uploaded_file: imageUrl || undefined,
          is_confirm: true,
        });
      } catch {
        // 임시저장 실패는 조용히 무시
      }

      // 에러 토스트 표시
      toast.setText(errorText);
      toast.setSubtext(errorSubtext);
      toast.setType('red');
      toast.show();
    } finally {
      setIsStartProductionLoading(false);
    }
  }, [
    watch,
    quotationId,
    quotationProducts,
    factoryId,
    selectedClientId,
    imageUrl,
    saveDraft,
    startProduction,
    toast,
    setIsStartProductionModalOpen,
    router,
    createdQuotationId,
    taxId,
    linkTaxInvoice,
    t,
  ]);

  return {
    handleSaveDraft,
    handleStartProduction,
    isSaveDraftLoading,
    isStartProductionLoading,
  };
};
