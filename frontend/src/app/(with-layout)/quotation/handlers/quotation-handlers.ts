import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { UseFormWatch, UseFormReset } from 'react-hook-form';
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
  quotationId?: number;
  quotationProducts: QuotationProductDetailResponseModel[];
  factoryId: number | null;
  selectedClientId: number | null;
  imageUrl?: string;
  saveDraft: (
    data: SaveDraftDataModel
  ) => Promise<{ quotation_id: number; status: string }>;
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
}

export const useQuotationHandlers = ({
  watch,
  reset,
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
}: QuotationHandlersProps) => {
  const [isSaveDraftLoading, setIsSaveDraftLoading] = useState(false);
  const [isStartProductionLoading, setIsStartProductionLoading] =
    useState(false);

  // 임시 저장 버튼 핸들러
  const handleSaveDraft = useCallback(
    async (isConfirm: boolean) => {
      try {
        setIsSaveDraftLoading(true);
        const formData = watch();

        if (!factoryId) {
          throw new Error('공장 정보가 없습니다.');
        }

        // 임시저장 시 에러 표시 활성화
        setShowErrors(true);

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
            client_type: 'customer',
          },
          due_date: formData.due_date,
          products: quotationProducts.map((product) => ({
            product_id: product.productId || null,
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
          // 견적 품목 변경 추적 초기화
          setInitialQuotationProducts([...quotationProducts]);
          // 에러 표시 상태 초기화
          setShowErrors(false);
          return true; // 성공 시 true 반환
        }
        return false; // 실패 시 false 반환
      } catch (error) {
        // 에러 메시지 설정
        const errorMessage =
          error instanceof Error ? error.message : '알 수 없는 오류';

        // 날짜 형식 에러인 경우 다른 토스트 메시지 표시
        if (errorMessage.includes('올바르지 않은 날짜 형식')) {
          toast.setText('올바르지 않은 날짜 형식입니다.');
          toast.setSubtext('날짜를 YYYY-MM-DD 형식으로 입력해 주세요.');
        } else {
          toast.setText('임시저장에 실패했습니다');
          toast.setSubtext(errorMessage);
        }
        
        toast.setType('red');
        toast.show();
        return false;
      } finally {
        setIsSaveDraftLoading(false);
      }
    },
    [
      watch,
      reset,
      quotationId,
      quotationProducts,
      factoryId,
      selectedClientId,
      imageUrl,
      saveDraft,
      setInitialQuotationProducts,
      setShowErrors,
      toast,
    ]
  );

  // 생산 시작 버튼 핸들러 (기존 startProduction API 사용)
  const handleStartProduction = useCallback(async () => {
    try {
      setIsStartProductionLoading(true);
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

      const productionData: ProductionDataModel = {
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
        const toastText = '생산 시작에 실패했습니다.';
        const toastSubtext = '다시 시도해 주세요.';

        toast.setText(toastText);
        toast.setSubtext(toastSubtext);
        toast.setType('red');
        toast.show();
        return;
      }

      // 성공 시 모달 닫고
      setIsStartProductionModalOpen(false);
      //프로젝트 페이지로 이동
      if (result && result.project_id) {
        router.push(`/production/${result.project_id}`);
      }
    } catch (error) {
      // 에러 메시지 추출
      let errorText = '생산 시작에 실패했습니다.';
      let errorSubtext = '다시 시도해 주세요.';

      if (error instanceof Error) {
        errorText = error.message;

        // 특정 에러 메시지에 따른 처리
        if (errorText.includes('가동 가능한 설비가 없습니다')) {
          errorText = '가동 가능한 설비가 없습니다.';
          errorSubtext = '설비 등록 후 생산을 다시 시작해 주세요.';
        } else if (errorText.includes('설비 조회 중 오류가 발생했습니다')) {
          errorText = '설비 조회 중 오류가 발생했습니다.';
          errorSubtext = '다시 시도해 주세요.';
        } else if (errorText.includes('올바르지 않은 날짜 형식')) {
          errorText = '올바르지 않은 날짜 형식입니다.';
          errorSubtext = '날짜를 YYYY-MM-DD 형식으로 입력해 주세요.';
        }
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
    startProduction,
    toast,
    setIsStartProductionModalOpen,
    router,
  ]);

  return {
    handleSaveDraft,
    handleStartProduction,
    isSaveDraftLoading,
    isStartProductionLoading,
  };
};
