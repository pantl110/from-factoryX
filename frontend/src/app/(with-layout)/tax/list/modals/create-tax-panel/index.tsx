import Panel from '@/ui/panel';
import SellerInfo from './seller-info';
import ClientInfo from './client-info';
import MiniBtn from '@/ui/mini-btn';
import { CaretDown } from '@phosphor-icons/react/dist/ssr';
import EmptySpace from '@/ui/empty-space';
import { useState } from 'react';
import AddItemDropdown from './add-item-dropdown';
import ClaimReceiptTaxModal from './claim-receipt-tax-modal';

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

  const handleIssueTypeDropdownOpen = () => {
    setIsIssueTypeDropdownOpen(!isIssueTypeDropdownOpen);
  };

  const handleIssueTypeSelect = (issueType: '청구' | '영수') => {
    // console.log("선택된 발행 방식:", issueType);
    setIsIssueTypeDropdownOpen(false);
    setSelectedIssueType(issueType);

    // 여기서 다른 모달을 띄우는 로직 추가
    if (issueType === '청구') {
      setIsClaimTaxModalOpen(true);
    } else if (issueType === '영수') {
      setIsClaimTaxModalOpen(true);
    }
  };

  // 발행방식 선택 버튼 드랍다운
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

  return (
    <>
      <Panel
        title="세금계산서"
        onClose={onClose}
        isCreateTax={true}
        isIssueTypeDropdownOpen={isIssueTypeDropdownOpen}
        onIssueTypeDropdownOpen={handleIssueTypeDropdownOpen}
        onIssueTypeDropdownClose={handleIssueTypeDropdownClose}
        onIssueTypeSelect={handleIssueTypeSelect}
      >
        <div className="flex gap-5">
          <SellerInfo />
          <ClientInfo />
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
