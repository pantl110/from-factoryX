import Chip from '@/ui/chip';
import ButtonSection from './button-section';
import QuotationStatusDropdown from './modals/quotation-status-dropdown';
import { usePortalDropdown, useToast } from '@/hooks';
import Toast from '@/ui/toast';
import { UseFormTrigger, UseFormWatch, FormState } from 'react-hook-form';
import { ClientModel, ProjectStatusType } from '@/types/data-model';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr';
import useMemberStore from '@/store/member-store';

// Extend ClientModel for quotation form to include due_date
interface QuotationFormModel extends ClientModel {
  due_date: string;
}

interface TitleSecProps {
  setIsTaxCreatePanelOpen: (open: boolean) => void;
  setIsEmailOpen: (open: boolean) => void;
  setIsPrintOpen: (open: boolean) => void;
  setIsStartProductionModalOpen: (open: boolean) => void;
  trigger: UseFormTrigger<QuotationFormModel>;
  watch: UseFormWatch<QuotationFormModel>;
  formState: FormState<QuotationFormModel>;
  projectStatus: ProjectStatusType;
  onProjectStatusChange: (status: ProjectStatusType) => void;
  hasQuotationProducts: boolean;
  onSaveDraft?: () => boolean | Promise<boolean>;
  isDirty: boolean;
  isFormFilled: boolean;
  taxId: number | null;
}

const TitleSec = ({
  setIsTaxCreatePanelOpen,
  setIsEmailOpen,
  setIsPrintOpen,
  setIsStartProductionModalOpen,
  trigger,
  watch,
  formState,
  projectStatus,
  onProjectStatusChange,
  hasQuotationProducts,
  onSaveDraft,
  isDirty,
  isFormFilled,
  taxId,
}: TitleSecProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';

  const { isToastOpen, isVisible, showToast } = useToast(); // 토스트 훅
  const {
    isOpen: isQuotationStatusDropdownOpen,
    openDropdown: openQuotationStatusDropdown,
    closeDropdown: closeQuotationStatusDropdown,
    anchorRect: quotationStatusAnchorRect,
  } = usePortalDropdown(); // 드랍다운 상태

  // 실시간으로 업체명 가져오기
  const clientName = watch('name');
  // 프로젝트 상태 체크
  const isOrderStatus = projectStatus === 'confirmed';
  const isSuspendedStatus = projectStatus === 'suspended';

  return (
    <div className="flex gap-1 mb-4 pr-10">
      <div className="flex-1 gap-1 w-full">
        <div className="flex justify-between">
          <div
            className={`${
              isOrderStatus || isViewer ? 'cursor-default' : 'cursor-pointer'
            } relative w-fit`}
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
              state={!isOrderStatus ? !isViewer : false}
              onClick={(e) => {
                if (isOrderStatus || isViewer) return;
                if (e) openQuotationStatusDropdown(e);
              }}
              cursor={
                isOrderStatus || isViewer ? 'cursor-default' : 'cursor-pointer'
              }
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
                    onQuotationClick={() => {
                      onProjectStatusChange('quotation');
                      closeQuotationStatusDropdown();
                    }}
                    onSuspendedClick={() => {
                      onProjectStatusChange('suspended');
                      closeQuotationStatusDropdown();
                    }}
                  />
                </div>
              )}
          </div>

          {/* 버튼 영역 */}
          <ButtonSection
            hasQuotationProducts={hasQuotationProducts}
            setIsTaxCreatePanelOpen={setIsTaxCreatePanelOpen}
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
                return false;
              }

              // 개별 필드 오류 확인 (입력된 값들 중에 유효하지 않은 것이 있는지)
              const hasErrors = Object.keys(formState.errors).length > 0;
              if (hasErrors) {
                return false; // 오류가 있으면 저장하지 않음
              }

              if (onSaveDraft) {
                return await onSaveDraft();
              }
              return false;
            }}
            isOrderStatus={isOrderStatus}
            changeToConfirmed={async () => {
              const isValid = await trigger();
              if (isValid) {
                onProjectStatusChange('confirmed');
              }
            }}
            isFormFilled={isFormFilled}
            isDirty={isDirty}
            taxId={taxId}
          />
        </div>
        <p className="Heading-1 truncate w-full">
          {clientName || '업체명을 입력해 주세요.'}
        </p>
      </div>

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
