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
import { useUpdateFactory, useCreateTaxInvoice } from '@/hooks';
import useFactoryStore from '@/store/factory-store';
import {
  FactoriesUpdateModel,
  CreateTaxInvoiceModel,
} from '@/types/data-model';
import { ClientInfoFormData, SellerInfoFormData } from '../../type';

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
  const [showErrors, setShowErrors] = useState(false);

  // 판매처 정보 폼 상태
  const [isSellerInfoValid, setIsSellerInfoValid] = useState(false);
  const [isSellerInfoDirty, setIsSellerInfoDirty] = useState(false);
  const [isSellerInfoOtherFieldsDirty, setIsSellerInfoOtherFieldsDirty] =
    useState(false);
  const [hasSellerInfoRequiredValues, setHasSellerInfoRequiredValues] =
    useState(false);
  const [sellerInfoFormData, setSellerInfoFormData] =
    useState<SellerInfoFormData | null>(null);

  // 거래처 정보 폼 상태
  const [isClientInfoValid, setIsClientInfoValid] = useState(false);
  const [isClientInfoDirty, setIsClientInfoDirty] = useState(false);
  const [hasClientInfoRequiredValues, setHasClientInfoRequiredValues] =
    useState(false);

  // 공장 정보 업데이트 훅
  const { updateFactory, isLoading: isUpdatingFactory } = useUpdateFactory();
  const factoryId = useFactoryStore((state) => state.factoryId);

  // 세금계산서 생성 훅
  const { createTaxInvoice, isLoading: isCreatingTaxInvoice } =
    useCreateTaxInvoice();

  // 발행방식 선택 버튼 클릭 핸들러
  const handleIssueTypeDropdownOpen = () => {
    // 두 폼 모두 유효해야 드롭다운 열기
    if (!isSellerInfoValid || !isClientInfoValid) {
      setShowErrors(true);
      return;
    }

    // 폼이 유효하면 에러 표시 해제하고 드롭다운 열기
    setShowErrors(false);

    // 공장 정보 업데이트 실행
    // if (sellerInfoFormData) {
    //   updateFactoryInfo(sellerInfoFormData);
    // }

    setIsIssueTypeDropdownOpen(!isIssueTypeDropdownOpen);
  };

  // 세금계산서 생성 함수
  const handleCreateTaxInvoice = async (
    taxInvoiceData: CreateTaxInvoiceModel
  ) => {
    try {
      // 실제 세금계산서 생성 API 호출
      const result = await createTaxInvoice(taxInvoiceData);

      if (result.success) {
        return true;
      } else {
        alert(result.error || '세금계산서 생성에 실패했습니다.');
        return false;
      }
    } catch (error) {
      alert('세금계산서 생성 실패: ' + error);
      return false;
    }
  };

  // 발행방식 선택 핸들러
  const handleIssueTypeSelect = (issueType: '청구' | '영수') => {
    setIsIssueTypeDropdownOpen(false);
    setSelectedIssueType(issueType);

    // 세금계산서 생성 모달 열기
    setIsClaimTaxModalOpen(true);
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
    hasRequiredValues: boolean,
    isOtherFieldsDirty: boolean,
    formData: SellerInfoFormData
  ) => {
    setIsSellerInfoValid(isValid);
    setIsSellerInfoDirty(isDirty);
    setHasSellerInfoRequiredValues(hasRequiredValues);
    setIsSellerInfoOtherFieldsDirty(isOtherFieldsDirty);
    setSellerInfoFormData(formData);
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

  // 공장 정보 업데이트 함수
  const updateFactoryInfo = (formData: SellerInfoFormData) => {
    if (factoryId && formData) {
      const updateData: FactoriesUpdateModel = {
        factory_id: factoryId,
        name: formData.companyName || '',
        business_registration_number: formData.businessNumber || '',
        representative_name: formData.representativeName || '',
        business_type: formData.businessType || '',
        business_category: formData.businessCategory || '',
        business_address: formData.address || '',
      };
      updateFactory(updateData);
    }
  };

  // 임시 저장 버튼 클릭 핸들러
  const handleTemporarySave = () => {
    // 공장 정보 업데이트
    if (isSellerInfoOtherFieldsDirty && sellerInfoFormData) {
      updateFactoryInfo(sellerInfoFormData);
    }

    // client_id 없으면 거래처 정보 생성

    // client_id 있으면 거래처 정보 업데이트
    // if (isClientInfoDirty && clientInfoFormData) {
    // }

    // 세금계산서 생성
    const taxInvoiceData: CreateTaxInvoiceModel = {
      factory: factoryId || 0,
      client: 1, // TODO: 실제 거래처 ID로 교체 필요
      product: [], // TODO: 실제 품목 ID 리스트로 교체 필요
      line_items: [],
      transaction_date: sellerInfoFormData?.writeDate || '',
    };
    handleCreateTaxInvoice(taxInvoiceData);

    // 판넬 닫기
    onClose();
  };

  // 헤더 버튼 구성
  const headerButton = (
    <div className="flex gap-2">
      <MiniBtn
        text="임시 저장"
        textColor="text-primary"
        bgColor="bg-primary-8"
        hoverColor="hover:bg-secondary-hover"
        onClick={handleTemporarySave}
        disabled={
          (!isSellerInfoDirty && !isClientInfoDirty) || isCreatingTaxInvoice
        }
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
            !hasSellerInfoRequiredValues ||
            !hasClientInfoRequiredValues ||
            isCreatingTaxInvoice
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

      {/* 세금계산서 생성 모달 */}
      {isClaimTaxModalOpen && selectedIssueType && (
        <ClaimReceiptTaxModal
          onClose={handleModalClose}
          onConfirm={handleModalConfirm}
          issueType={selectedIssueType}
          onCreateTaxInvoice={handleCreateTaxInvoice}
        />
      )}
    </>
  );
};

export default CreatTaxPanel;
