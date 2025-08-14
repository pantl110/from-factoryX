import Chip from '@/ui/chip';
import ButtonSection from './button-section';
import QuotationStatusDropdown from './modals/quotation-status-dropdown';
import { usePortalDropdown, useToast } from '@/hooks';
import Toast from '@/ui/toast';
import { UseFormTrigger, UseFormWatch } from 'react-hook-form';
import { ClientModel } from '@/types/data-model';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { useUpdateProjectStatus } from '@/hooks';

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
  isOrderStatus: boolean;
  setIsOrderStatus: (status: boolean) => void;
  hasQuotationProducts: boolean;
  onSaveDraft?: () => void | Promise<void>;
  isDirty: boolean;
  isSuspendedStatus: boolean;
  setIsSuspendedStatus: (status: boolean) => void;
  projectId?: number;
  isFormValid: boolean;
}

const TitleSec = ({
  setIsEmailOpen,
  setIsPrintOpen,
  setIsStartProductionModalOpen,
  trigger,
  watch,
  isOrderStatus,
  setIsOrderStatus,
  hasQuotationProducts,
  onSaveDraft,
  isDirty,
  isSuspendedStatus,
  setIsSuspendedStatus,
  projectId,
  isFormValid,
}: TitleSecProps) => {
  // 실시간으로 업체명 가져오기
  const clientName = watch('name');

  // 토스트 훅
  const { isToastOpen, isVisible, showToast } = useToast();

  // 프로젝트 상태 업데이트 훅
  const { updateProjectStatus } = useUpdateProjectStatus();

  // 드랍다운 상태
  const {
    isOpen: isQuotationStatusDropdownOpen,
    openDropdown: openQuotationStatusDropdown,
    closeDropdown: closeQuotationStatusDropdown,
    anchorRect: quotationStatusAnchorRect,
  } = usePortalDropdown();

  // 프로젝트 상태 변경 핸들러
  const handleStatusChange = async (newStatus: string) => {
    if (!projectId) {
      return;
    }

    try {
      const result = await updateProjectStatus(projectId, newStatus);
      if (result.success) {
        // 상태 변경 성공 시 UI 업데이트
        if (newStatus === 'quotation') {
          setIsSuspendedStatus(false);
          setIsOrderStatus(false);
        } else if (newStatus === 'suspended') {
          setIsSuspendedStatus(true);
          setIsOrderStatus(false);
        } else if (newStatus === 'order') {
          setIsOrderStatus(true);
          setIsSuspendedStatus(false);
        }
      }
    } catch {
      // 에러 처리 없음
    }
    closeQuotationStatusDropdown();
  };

  return (
    <div className="flex gap-1 mb-4 pr-10">
      <div className="flex-1 gap-1">
        <div
          className={`${isOrderStatus ? 'cursor-default' : 'cursor-pointer'} relative w-fit`}
        >
          <Chip
            text={
              isOrderStatus
                ? '주문 확정'
                : isSuspendedStatus
                  ? '중단'
                  : '견적 요청'
            }
            bgColor={
              isOrderStatus
                ? 'bg-orange-8'
                : isSuspendedStatus
                  ? 'bg-red-8'
                  : 'bg-yellow-8'
            }
            textColor={
              isOrderStatus
                ? 'text-orange'
                : isSuspendedStatus
                  ? 'text-red'
                  : 'text-yellow'
            }
            state={!isOrderStatus}
            onClick={(e) => {
              if (isOrderStatus) return;
              if (e) openQuotationStatusDropdown(e);
            }}
            cursor={isOrderStatus ? 'cursor-default' : 'cursor-pointer'}
          />
          {isQuotationStatusDropdownOpen &&
            quotationStatusAnchorRect &&
            !isOrderStatus && (
              <div
                style={{
                  position: 'fixed',
                  left: quotationStatusAnchorRect.left,
                  top: quotationStatusAnchorRect.bottom + 8,
                  zIndex: 10,
                }}
              >
                <QuotationStatusDropdown
                  onClose={closeQuotationStatusDropdown}
                  onQuotationClick={() => handleStatusChange('quotation')}
                  onSuspendedClick={() => handleStatusChange('suspended')}
                />
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
          setIsEmailOpen(true);
        }}
        onPrintClick={async () => {
          setIsPrintOpen(true);
        }}
        onStartProductionClick={async () => {
          const isValid = await trigger();
          if (isValid) {
            setIsStartProductionModalOpen(true);
          }
        }}
        onSaveDraft={async () => {
          // 업체명이 입력되지 않았으면 토스트 표시하고 함수 종료
          if (!clientName || clientName.trim() === '') {
            showToast();
            return;
          }
          if (onSaveDraft) {
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
        isDirty={isDirty}
      />

      {/* 임지저장 눌렀을 때 토스트 메시지 */}
      {isToastOpen && (
        <Toast
          icon={<WarningCircle size={20} className="text-red" />}
          text="임시저장을 할 수 없어요."
          subtext="임시저장을 하기 위해선 업체명은 꼭 입력해야 해요."
          type="red"
          isVisible={isVisible}
        />
      )}
    </div>
  );
};

export default TitleSec;
