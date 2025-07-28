import Chip from '@/ui/chip';
import ButtonSection from './button-section';
import QuotationStatusDropdown from './modals/quotation-status-dropdown';
import { usePortalDropdown } from '@/hooks/use-portal-dropdown';
import { UseFormTrigger, UseFormWatch } from 'react-hook-form';
import { ClientModel } from '@/types/data-model';
import { useMemo } from 'react';

// Extend ClientModel for quotation form to include due_date
interface QuotationFormModel extends ClientModel {
  due_date: string;
}

interface TitleSecProps {
  clientName?: string;
  setIsEmailOpen: (open: boolean) => void;
  setIsPrintOpen: (open: boolean) => void;
  setIsStartProductionModalOpen: (open: boolean) => void;
  trigger: UseFormTrigger<QuotationFormModel>;
  watch: UseFormWatch<QuotationFormModel>;
  isOrderStatus: boolean;
  setIsOrderStatus: (status: boolean) => void;
}

const TitleSec = ({
  clientName,
  setIsEmailOpen,
  setIsPrintOpen,
  setIsStartProductionModalOpen,
  trigger,
  watch,
  isOrderStatus,
  setIsOrderStatus,
}: TitleSecProps) => {
  // 폼 유효성 검사
  const formValues = watch();
  const isFormValid = useMemo(() => {
    const requiredFields = [
      'name',
      'business_registration_number',
      'representative_name',
      'due_date',
      'business_type',
      'business_category',
      'address',
    ];

    return requiredFields.every((field) => {
      const value = formValues[field as keyof QuotationFormModel];
      return value && value.toString().trim() !== '';
    });
  }, [formValues]);

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
