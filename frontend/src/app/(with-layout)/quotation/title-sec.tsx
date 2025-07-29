import Chip from '@/ui/chip';
import ButtonSection from './button-section';
import QuotationStatusDropdown from './modals/quotation-status-dropdown';
import { usePortalDropdown } from '@/hooks/use-portal-dropdown';
import { UseFormTrigger, UseFormWatch, FormState } from 'react-hook-form';
import { ClientModel } from '@/types/data-model';
import { useMemo } from 'react';

// Extend ClientModel for quotation form to include due_date
interface QuotationFormModel extends ClientModel {
  due_date: string;
}

interface TitleSecProps {
  setIsEmailOpen: (open: boolean) => void;
  setIsPrintOpen: (open: boolean) => void;
  setIsStartProductionModalOpen: (open: boolean) => void;
  trigger: UseFormTrigger<QuotationFormModel>;
  watch: UseFormWatch<QuotationFormModel>;
  formState: FormState<QuotationFormModel>;
  isOrderStatus: boolean;
  setIsOrderStatus: (status: boolean) => void;
  hasQuotationProducts: boolean;
  onSaveDraft?: () => void | Promise<void>;
}

const TitleSec = ({
  setIsEmailOpen,
  setIsPrintOpen,
  setIsStartProductionModalOpen,
  trigger,
  watch,
  formState,
  isOrderStatus,
  setIsOrderStatus,
  hasQuotationProducts,
  onSaveDraft,
}: TitleSecProps) => {
  // 실시간으로 업체명 가져오기
  const clientName = watch('name');

  // 폼 유효성 검사 - 실제 필드 값과 에러 상태 확인
  const isFormValid = useMemo(() => {
    return formState.isValid && !Object.keys(formState.errors).length;
  }, [formState.isValid, formState.errors]);

  // 드랍다운 상태
  const {
    isOpen: isQuotationStatusDropdownOpen,
    openDropdown: openQuotationStatusDropdown,
    closeDropdown: closeQuotationStatusDropdown,
    anchorRect: quotationStatusAnchorRect,
  } = usePortalDropdown();

  return (
    <div className="flex gap-1 mb-4 pr-10">
      <div className="flex-1 gap-1">
        <div className="cursor-pointer relative w-fit">
          <Chip
            text="견적 요청"
            bgColor="bg-yellow-8"
            textColor="text-yellow"
            state={true}
            onClick={(e) => {
              if (e) openQuotationStatusDropdown(e);
            }}
          />
          {isQuotationStatusDropdownOpen && quotationStatusAnchorRect && (
            <div
              style={{
                position: 'fixed',
                left: quotationStatusAnchorRect.left,
                top: quotationStatusAnchorRect.bottom + 8,
                zIndex: 10,
              }}
            >
              <QuotationStatusDropdown onClose={closeQuotationStatusDropdown} />
            </div>
          )}
        </div>
        <p className="Heading-1 mt-2">
          {clientName || '업체명을 입력해 주세요.'}
        </p>
      </div>
      <ButtonSection
        hasQuotationProducts={hasQuotationProducts}
        onEmailClick={async () => {
          const isValid = await trigger();
          if (isValid) {
            setIsEmailOpen(true);
          }
        }}
        onPrintClick={async () => {
          const isValid = await trigger();
          if (isValid) {
            setIsPrintOpen(true);
          }
        }}
        onStartProductionClick={async () => {
          const isValid = await trigger();
          if (isValid) {
            setIsStartProductionModalOpen(true);
          }
        }}
        onSaveDraft={async () => {
          const isValid = await trigger();
          if (isValid && onSaveDraft) {
            await onSaveDraft();
          }
        }}
        isOrderStatus={isOrderStatus}
        setIsOrderStatus={async (status: boolean) => {
          const isValid = await trigger();
          if (isValid) {
            setIsOrderStatus(status);
          }
        }}
        isFormValid={isFormValid}
      />
    </div>
  );
};

export default TitleSec;
