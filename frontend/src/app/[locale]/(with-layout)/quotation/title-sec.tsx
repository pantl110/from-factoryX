import Chip from '@/ui/chip';
import ButtonSection from './button-section';
import QuotationStatusDropdown from './modals/quotation-status-dropdown';
import { usePortalDropdown, useToast } from '@/hooks';
import Toast from '@/ui/toast';
import { UseFormTrigger, UseFormWatch } from 'react-hook-form';
import { ClientModel, ProjectStatusType } from '@/types/data-model';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr';
import useMemberStore from '@/store/member-store';
import { useSearchParams } from 'next/navigation';
import useSubscriptionStore from '@/store/subscription-store';
import { useTranslations } from 'next-intl';

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
  projectStatus: ProjectStatusType;
  onProjectStatusChange: (status: ProjectStatusType) => void;
  hasQuotationProducts: boolean;
  onSaveDraft?: (isConfirm: boolean) => boolean | Promise<boolean>;
  isDirty: boolean;
  isFormFilled: boolean;
  taxId: number | null;
  isSaveDraftLoading?: boolean;
  setShowErrors: (show: boolean) => void;
  refresh: () => void;
}

const TitleSec = ({
  setIsTaxCreatePanelOpen,
  setIsEmailOpen,
  setIsPrintOpen,
  setIsStartProductionModalOpen,
  trigger,
  watch,
  projectStatus,
  onProjectStatusChange,
  hasQuotationProducts,
  onSaveDraft,
  isDirty,
  isFormFilled,
  taxId,
  isSaveDraftLoading,
  setShowErrors,
  refresh,
}: TitleSecProps) => {
  const tStatus = useTranslations('project.status');
  const tTitleSec = useTranslations('quotation.titleSec');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  // URL에서 projectId 확인
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');
  const hasProjectId = !!projectId;

  const { isToastOpen, isVisible, showToast } = useToast(); // 토스트 훅
  const {
    isOpen: isQuotationStatusDropdownOpen,
    openDropdown: openQuotationStatusDropdown,
    closeDropdown: closeQuotationStatusDropdown,
    anchorRect: quotationStatusAnchorRect,
  } = usePortalDropdown(); // 드랍다운 상태

  // 실시간으로 거래처명 가져오기
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
              isOrderStatus || isViewer || !hasProjectId || !hasSubscription()
                ? 'cursor-default'
                : 'cursor-pointer'
            } relative w-fit`}
          >
            <Chip
              text={
                isOrderStatus
                  ? tStatus('confirmed')
                  : isSuspendedStatus
                    ? tStatus('suspended')
                    : tStatus('quotation')
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
              state={
                !isOrderStatus && hasProjectId
                  ? !isViewer && hasSubscription()
                  : false
              }
              onClick={(e) => {
                if (
                  isOrderStatus ||
                  isViewer ||
                  !hasProjectId ||
                  !hasSubscription()
                )
                  return;
                if (e) openQuotationStatusDropdown(e);
              }}
              cursor={
                isOrderStatus || isViewer || !hasProjectId || !hasSubscription()
                  ? 'cursor-default'
                  : 'cursor-pointer'
              }
            />
            {isQuotationStatusDropdownOpen &&
              quotationStatusAnchorRect &&
              !isOrderStatus &&
              hasProjectId && (
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
              // 폼 유효성 검사
              const isValid = await trigger();
              if (!isValid) {
                setShowErrors(true); // 에러 표시 활성화
                return; // 유효성 검사 실패 시 이메일 모달 열지 않음
              }

              // 이메일 전송 전에 임시저장
              const isSaveSuccess = await onSaveDraft?.(false);
              if (isSaveSuccess) {
                setIsEmailOpen(true);
              }
            }}
            onPrintClick={async () => {
              // 출력 전에 임시저장
              const isSaveSuccess = await onSaveDraft?.(false);
              if (isSaveSuccess) {
                setIsPrintOpen(true);
              }
            }}
            onStartProductionClick={async () => {
              const isValid = await trigger();
              if (isValid) {
                setIsStartProductionModalOpen(true);
              } else {
                setShowErrors(true); // 에러 표시 활성화
              }
            }}
            onSaveDraft={async (isConfirm: boolean) => {
              // 임시저장: 값이 비어 있어도 저장 가능. 거래처명만 체크하고, 폼 유효성 검사는 실행하지 않음
              if (!isConfirm) {
                if (!clientName || clientName.trim() === '') {
                  showToast();
                  return false;
                }
                if (onSaveDraft) {
                  return await onSaveDraft(false);
                }
                return false;
              }

              // 주문확정: 전체 폼 유효성 검사 수행
              const isValid = await trigger();
              if (!isValid) {
                setShowErrors(true); // 에러 표시 활성화
                return false; // 오류가 있으면 저장하지 않음
              }

              if (onSaveDraft) {
                return await onSaveDraft(true); // isConfirm = true 주문확정
              }
              return false;
            }}
            isOrderStatus={isOrderStatus}
            isFormFilled={isFormFilled}
            isDirty={isDirty}
            taxId={taxId}
            isSaveDraftLoading={isSaveDraftLoading}
            refresh={refresh}
          />
        </div>
        <p className="Heading-1 truncate w-full">
          {clientName || tTitleSec('enterClientName')}
        </p>
      </div>

      {/* 임지저장 눌렀을 때 토스트 메시지 */}
      {isToastOpen && (
        <Toast
          icon={<WarningCircle size={20} className="text-red" />}
          text={tTitleSec('toast.cannotSaveDraft')}
          subtext={tTitleSec('toast.clientNameRequired')}
          type="red"
          isVisible={isVisible}
        />
      )}
    </div>
  );
};

export default TitleSec;
