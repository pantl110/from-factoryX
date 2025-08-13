import Panel from '@/ui/panel';
import SellerInfo from './seller-info';
import ClientInfo from './client-info';
import MiniBtn from '@/ui/mini-btn';
import { CaretDown } from '@phosphor-icons/react/dist/ssr';
import EmptySpace from '@/ui/empty-space';
import { useState, useEffect } from 'react';
import AddItemDropdown from './add-item-dropdown';
import ClaimReceiptTaxModal from './claim-receipt-tax-modal';
import IssueTypeDropdown from './issue-type-dropdown';

interface CreatTaxPanelProps {
  onClose: () => void;
}

const CreatTaxPanel = ({ onClose }: CreatTaxPanelProps) => {
  const [isAddProductDropdownOpen, setIsAddProductDropdownOpen] =
    useState(false);
  const [isIssueTypeDropdownOpen, setIsIssueTypeDropdownOpen] = useState(false);
  const [isClaimTaxModalOpen, setIsClaimTaxModalOpen] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState<
    '청구' | '영수' | null
  >(null);
  const [isSellerInfoValid, setIsSellerInfoValid] = useState(false);
  const [isSellerInfoDirty, setIsSellerInfoDirty] = useState(false);
  const [hasSellerInfoRequiredValues, setHasSellerInfoRequiredValues] =
    useState(false);
  const [isClientInfoValid, setIsClientInfoValid] = useState(false);
  const [isClientInfoDirty, setIsClientInfoDirty] = useState(false);
  const [hasClientInfoRequiredValues, setHasClientInfoRequiredValues] =
    useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // 발행방식 선택 버튼 클릭 핸들러
  const handleIssueTypeDropdownOpen = () => {
    // 두 폼 모두 유효해야 드롭다운 열기
    if (!isSellerInfoValid || !isClientInfoValid) {
      setShowErrors(true);
      return;
    }

    // 폼이 유효하면 에러 표시 해제하고 드롭다운 열기
    setShowErrors(false);
    setIsIssueTypeDropdownOpen(!isIssueTypeDropdownOpen);
  };

  const handleIssueTypeSelect = (issueType: '청구' | '영수') => {
    setIsIssueTypeDropdownOpen(false);
    setSelectedIssueType(issueType);

    // 여기서 다른 모달을 띄우는 로직 추가
    if (issueType === '청구') {
      setIsClaimTaxModalOpen(true);
    } else if (issueType === '영수') {
      setIsClaimTaxModalOpen(true);
    }
  };

  // 발행방식 선택 버튼 드롭다운
  const handleIssueTypeDropdownClose = () => {
    setIsIssueTypeDropdownOpen(false);
  };

  // 발행방식 선택 모달 닫기
  const handleModalClose = () => {
    setIsClaimTaxModalOpen(false);
    setSelectedIssueType(null);
  };

  const handleModalConfirm = () => {
    // 여기서 다음 모달을 띄우거나 다른 처리를 할 수 있습니다
    // console.log("모달 확인 버튼 클릭됨");
  };

  // 판매처 정보 폼 유효성 및 변경 상태 변경 핸들러
  const handleSellerInfoChange = (
    isValid: boolean,
    isDirty: boolean,
    hasRequiredValues: boolean
  ) => {
    setIsSellerInfoValid(isValid);
    setIsSellerInfoDirty(isDirty);
    setHasSellerInfoRequiredValues(hasRequiredValues);
  };

  // 거래처 정보 폼 유효성 및 변경 상태 변경 핸들러
  const handleClientInfoChange = (
    isValid: boolean,
    isDirty: boolean,
    hasRequiredValues: boolean
  ) => {
    setIsClientInfoValid(isValid);
    setIsClientInfoDirty(isDirty);
    setHasClientInfoRequiredValues(hasRequiredValues);
  };

  // showErrors가 true일 때 폼이 모두 유효해지면 자동으로 false로 변경
  useEffect(() => {
    if (showErrors && isSellerInfoValid && isClientInfoValid) {
      setShowErrors(false);
    }
  }, [showErrors, isSellerInfoValid, isClientInfoValid]);

  // 헤더 버튼 구성
  const headerButton = (
    <div className="flex gap-2">
      <MiniBtn
        text="임시 저장"
        textColor="text-primary"
        bgColor="bg-primary-8"
        hoverColor="hover:bg-secondary-hover"
        onClick={() => {}}
        disabled={!isSellerInfoDirty && !isClientInfoDirty}
      />
      <div className="relative">
        <MiniBtn
          text="발행 방식 선택"
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
          icon={CaretDown}
          iconPosition="right"
          onClick={handleIssueTypeDropdownOpen}
          disabled={
            !hasSellerInfoRequiredValues || !hasClientInfoRequiredValues
          }
        />
        {isIssueTypeDropdownOpen && (
          <IssueTypeDropdown
            onClose={handleIssueTypeDropdownClose}
            onSelect={handleIssueTypeSelect}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      <Panel title="세금계산서" onClose={onClose} headerButton={headerButton}>
        <div className="flex gap-5">
          <SellerInfo
            onFormChange={handleSellerInfoChange}
            showErrors={showErrors}
          />
          <ClientInfo
            onFormChange={handleClientInfoChange}
            showErrors={showErrors}
          />
        </div>

        <div className="flex flex-col gap-3 mt-9">
          <div className="flex justify-between items-center w-full relative">
            <h3 className="Heading-3 h-10 items-center flex">주문 품목 정보</h3>
            <MiniBtn
              text="품목 추가"
              textColor="text-dg"
              borderColor="border-lg"
              hoverColor="hover:bg-bg"
              icon={CaretDown}
              iconPosition="right"
              onClick={() => setIsAddProductDropdownOpen(true)}
            />
            {isAddProductDropdownOpen && (
              <div className="absolute top-12 right-0">
                <AddItemDropdown
                  onClose={() => setIsAddProductDropdownOpen(false)}
                  onSelect={() => {
                    setIsAddProductDropdownOpen(false);
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <EmptySpace
              title="품목이 아직 등록되지 않았어요."
              description="선발행된 세금계산서에는 추후 품목이 추가될 수 있어요."
              height="h-50"
            />
          </div>
        </div>
      </Panel>
      {isClaimTaxModalOpen && selectedIssueType && (
        <ClaimReceiptTaxModal
          onClose={handleModalClose}
          onConfirm={handleModalConfirm}
          issueType={selectedIssueType}
        />
      )}
    </>
  );
};

export default CreatTaxPanel;
