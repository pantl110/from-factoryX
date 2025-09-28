import Panel from '@/ui/panel';
import SellerInfo from './seller-info';
import ClientInfo from './client-info';
import MiniBtn from '@/ui/mini-btn';
import { CaretDown } from '@phosphor-icons/react/dist/ssr';
import { useState, useEffect, useCallback, useRef } from 'react';
import AddItemDropdown from './add-item-dropdown';
import ClaimReceiptTaxModal from './claim-receipt-tax-modal';
import IssueTypeDropdown from './issue-type-dropdown';
import {
  useUpdateFactory,
  useCreateTaxInvoice,
  useCreateClient,
  useUpdateClient,
  useLinkTaxInvoice,
} from '@/hooks';
import { useCheckBarobill } from '@/hooks/tax/barobil/use-check-barobill';
import useMemberStore from '@/store/member-store';
import {
  FactoriesUpdateModel,
  CreateTaxInvoiceModel,
  ClientModel,
  ClientUpdateModel,
  TaxClientInfoModel,
} from '@/types/data-model';
import { TransactionType } from '@/types/status-type';
import { ClientInfoFormDataModel, SellerInfoFormDataModel } from '../type';
import ProductInfo, {
  ProductInfoRefModel,
  ProductFormDataModel,
} from './product-info';
import { PanelRefModel } from '@/ui/panel';

// 세금계산서 편집용 품목 데이터 타입
interface TaxProductEditModel {
  productId: number;
  quantity: number;
  unit_price: number;
  product_name: string;
  product_code: string;
  product_spec: string;
}

interface CreatTaxPanelProps {
  onClose: () => void;
  taxId?: number;
  initialClientData?: TaxClientInfoModel;
  initialProducts?: TaxProductEditModel[];
  setIsEditingMode?: (isEditingMode: boolean) => void;
  onTaxCreated?: (taxId: number) => void; // 새로 생성된 세금계산서 ID 전달
  projectId?: number;
}

const CreatTaxPanel = ({
  onClose,
  taxId,
  initialClientData,
  initialProducts,
  setIsEditingMode,
  onTaxCreated,
  projectId,
}: CreatTaxPanelProps) => {
  const [isAddProductDropdownOpen, setIsAddProductDropdownOpen] =
    useState(false);
  const [isIssueTypeDropdownOpen, setIsIssueTypeDropdownOpen] = useState(false);
  const [isClaimTaxModalOpen, setIsClaimTaxModalOpen] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState<
    '청구' | '영수' | null
  >(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false); // 새로운 품목 추가 디테일판넬 상태

  // 판매처 정보 폼 상태
  const [isSellerInfoDirty, setIsSellerInfoDirty] = useState(false); // 전체적인 폼 변경 상태(작성일자 포함)
  const [isSellerInfoOtherFieldsDirty, setIsSellerInfoOtherFieldsDirty] =
    useState(false); // 공장 정보를 업데이트 할 때 사용 (작성일자 포함 안함)
  const [hasSellerInfoRequiredValues, setHasSellerInfoRequiredValues] =
    useState(false); // 판매처 정보 폼 필수값 채워져 있는지 확인
  const [isSellerInfoValid, setIsSellerInfoValid] = useState(false); // 판매처 정보 폼 유효성 상태 (값들이 유효한지)
  const [sellerInfoFormData, setSellerInfoFormData] =
    useState<SellerInfoFormDataModel | null>(null);

  // 거래처 정보 폼 상태
  const [isClientInfoDirty, setIsClientInfoDirty] = useState(false);
  const [hasClientInfoRequiredValues, setHasClientInfoRequiredValues] =
    useState(false);
  const [isClientInfoValid, setIsClientInfoValid] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<
    number | undefined
  >();
  const [clientInfoFormData, setClientInfoFormData] =
    useState<ClientInfoFormDataModel | null>(null);

  // 주문품목 정보 폼 상태
  const [isProductInfoDirty, setIsProductInfoDirty] = useState(false);
  const [isProductInfoValid, setIsProductInfoValid] = useState(false);
  const [productInfoFormData, setProductInfoFormData] =
    useState<ProductFormDataModel | null>(null);

  // 그 외 폼 관련 상태
  const [isSaving, setIsSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // ProductInfo ref
  const productInfoRef = useRef<ProductInfoRefModel>(null);
  // Panel ref (판넬 닫기 함수 전달)
  const panelRef = useRef<PanelRefModel>(null);
  // 강제로 에러 표시를 위한 ref
  const forceShowErrors = useRef(false);

  const { updateFactory } = useUpdateFactory();
  const { createClient } = useCreateClient();
  const { updateClient } = useUpdateClient();
  const { createTaxInvoice } = useCreateTaxInvoice();
  const { linkTaxInvoice } = useLinkTaxInvoice();
  const { checkBarobill } = useCheckBarobill();

  // 바로빌 등록 실패 토스트 훅
  // const { showToast, isToastOpen, isVisible } = useToast();
  // const [errorMessage, setErrorMessage] = useState(''); // 에러 메시지 상태

  const factoryId = useMemberStore((state) => state.factoryId);

  // 판넬에 들어올 때 바로빌 상태 확인 및 회원가입
  // useEffect(() => {
  //   const checkBarobillStatus = async () => {
  //     if (factoryId) {
  //       try {
  //         const isBarobillValid = await checkBarobill();
  //         if (isBarobillValid) {
  //           // 바로빌 연동 성공
  //         } else {
  //           // 바로빌 연동 실패 시 에러 메시지 설정 후 토스트 표시
  //           setErrorMessage('다시 시도해 주세요.');
  //           showToast();
  //           // 토스트가 표시된 후 2초 뒤에 판넬 닫기
  //           setTimeout(() => {
  //             panelRef.current?.handleClose();
  //           }, 2000);
  //         }
  //       } catch (error) {
  //         // 에러 발생 시 실제 에러 메시지 설정 후 토스트 표시
  //         let errorMsg = '다시 시도해 주세요.';

  //         if (error instanceof Error) {
  //           // 에러 메시지에서 콜론 뒤의 부분만 추출
  //           const { message } = error;
  //           if (message.includes(':')) {
  //             errorMsg = message.split(':')[1]?.trim() || message;
  //           } else {
  //             errorMsg = message;
  //           }
  //         }

  //         setErrorMessage(errorMsg);
  //         showToast();
  //         // 토스트가 표시된 후 2초 뒤에 판넬 닫기
  //         setTimeout(() => {
  //           panelRef.current?.handleClose();
  //         }, 2000);
  //       }
  //     }
  //   };

  //   checkBarobillStatus();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [factoryId]);

  // 주문품목 정보 폼 변경 핸들러
  const handleProductInfoChange = useCallback(
    (isDirty: boolean, isValid: boolean, formData: ProductFormDataModel) => {
      setIsProductInfoDirty(isDirty);
      setIsProductInfoValid(isValid);
      setProductInfoFormData(formData);
    },
    []
  );

  // 세금계산서 생성 함수
  const handleCreateTaxInvoice = useCallback(
    async (taxInvoiceData: CreateTaxInvoiceModel) => {
      try {
        // 실제 세금계산서 생성 API 호출
        const result = await createTaxInvoice(taxInvoiceData);

        if (result.success) {
          return result.data;
        } else {
          alert(result.error || '세금계산서 생성에 실패했습니다.');
          return false;
        }
      } catch (error) {
        alert('세금계산서 생성 실패: ' + error);
        return false;
      }
    },
    [createTaxInvoice]
  );

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

  // 판매처 정보 폼 유효성 및 변경 상태 변경 핸들러
  const handleSellerInfoChange = useCallback(
    (
      isValid: boolean,
      isDirty: boolean,
      hasRequiredValues: boolean,
      isOtherFieldsDirty: boolean,
      formData: SellerInfoFormDataModel
    ) => {
      setIsSellerInfoValid(isValid);
      setIsSellerInfoDirty(isDirty);
      setHasSellerInfoRequiredValues(hasRequiredValues);
      setIsSellerInfoOtherFieldsDirty(isOtherFieldsDirty);
      setSellerInfoFormData(formData);
    },
    []
  );

  // 거래처 정보 폼 유효성 및 변경 상태 변경 핸들러
  const handleClientInfoChange = useCallback(
    (
      isValid: boolean,
      isDirty: boolean,
      hasRequiredValues: boolean,
      clientId?: number,
      formData?: ClientInfoFormDataModel
    ) => {
      setIsClientInfoValid(isValid);
      setIsClientInfoDirty(isDirty);
      setHasClientInfoRequiredValues(hasRequiredValues);
      setSelectedClientId(clientId);
      setClientInfoFormData(formData || null);
    },
    []
  );

  // showErrors가 true일 때 폼이 모두 유효해지면 자동으로 false로 변경 (강제 표시가 아닐 때만)
  useEffect(() => {
    if (
      showErrors &&
      isSellerInfoValid &&
      isClientInfoValid &&
      !forceShowErrors.current
    ) {
      setShowErrors(false);
    }
  }, [showErrors, isSellerInfoValid, isClientInfoValid]);

  // 초기 데이터가 있을 때 폼 상태 자동 업데이트 // 수정 버튼을 눌러서 돌아오면 유효성 검사 하기 위해 사용
  useEffect(() => {
    if (sellerInfoFormData) {
      const hasRequiredSellerValues = !!(
        sellerInfoFormData.companyName &&
        sellerInfoFormData.businessNumber &&
        sellerInfoFormData.representativeName &&
        sellerInfoFormData.businessType &&
        sellerInfoFormData.businessCategory
      );
      setHasSellerInfoRequiredValues(hasRequiredSellerValues);
    }

    if (initialClientData) {
      // 거래처 정보의 필수값들이 실제로 채워져 있는지 확인
      const hasRequiredClientValues = !!(
        initialClientData.name &&
        initialClientData.business_registration_number &&
        initialClientData.representative_name &&
        initialClientData.business_type &&
        initialClientData.business_category
      );

      if (hasRequiredClientValues) {
        setHasClientInfoRequiredValues(true);
      }
    }

    if (initialProducts && initialProducts.length > 0) {
      // 주문품목 정보의 유효성을 실제로 검증
      const hasValidProducts = initialProducts.every(
        (product) =>
          product.productId &&
          product.quantity &&
          product.unit_price &&
          product.product_name &&
          product.product_code &&
          product.product_spec
      );

      if (hasValidProducts) {
        setIsProductInfoValid(true);
      }
    }
  }, [initialClientData, initialProducts, sellerInfoFormData]);

  // 공장 정보 업데이트 함수
  const updateFactoryInfo = (formData: SellerInfoFormDataModel) => {
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

  // 거래처 정보 생성 함수
  const createClientInfo = useCallback(
    async (clientFormData: ClientInfoFormDataModel) => {
      if (!factoryId)
        return { success: false, error: '공장 ID가 설정되지 않았습니다.' };

      const clientData: ClientModel = {
        factory_id: factoryId,
        name: clientFormData.companyName || '',
        business_registration_number: clientFormData.businessNumber || '',
        representative_name: clientFormData.representativeName || '',
        business_type: clientFormData.businessType || '',
        business_category: clientFormData.businessCategory || '',
        address: clientFormData.address || '',
        is_customer: true,
        is_supplier: false,
      };

      return await createClient(clientData);
    },
    [factoryId, createClient]
  );

  // 거래처 정보 수정 함수
  const updateClientInfo = useCallback(
    async (clientId: number, clientFormData: ClientInfoFormDataModel) => {
      if (!factoryId)
        return { success: false, error: '공장 ID가 설정되지 않았습니다.' };

      const clientData: ClientUpdateModel = {
        client_id: clientId,
        factory_id: factoryId,
        name: clientFormData.companyName || '',
        business_registration_number: clientFormData.businessNumber || '',
        representative_name: clientFormData.representativeName || '',
        business_type: clientFormData.businessType || '',
        business_category: clientFormData.businessCategory || '',
        address: clientFormData.address || '',
        is_customer: true,
      };

      return await updateClient(clientData);
    },
    [factoryId, updateClient]
  );

  // 임시 저장 버튼 클릭 핸들러
  const handleTemporarySave = async (
    transactionType: TransactionType,
    projectId?: number
  ) => {
    setIsSaving(true);

    try {
      // 공장 정보 업데이트
      if (isSellerInfoOtherFieldsDirty && sellerInfoFormData) {
        updateFactoryInfo(sellerInfoFormData);
      }

      // 거래처 정보 처리
      let currentClientId = selectedClientId;

      if (selectedClientId === undefined) {
        // 새로운 거래처 생성 (거래처 정보가 입력되어 있을 때만)
        if (clientInfoFormData && hasClientInfoRequiredValues) {
          const createResult = await createClientInfo(clientInfoFormData);
          if (createResult.success && createResult.data) {
            // 생성된 거래처 ID로 상태 업데이트 및 현재 ID 설정
            currentClientId = createResult.data.id;
            setSelectedClientId(createResult.data.id);
          } else {
            alert(
              '거래처 생성에 실패했습니다: ' +
                (createResult.error || '알 수 없는 오류')
            );
            setIsSaving(false);
          }
        }
      } else {
        // 기존 거래처 정보 수정
        if (isClientInfoDirty && clientInfoFormData) {
          const updateResult = await updateClientInfo(
            selectedClientId,
            clientInfoFormData
          );
          if (!updateResult.success) {
            // 거래처 수정 실패 시 새로 생성 시도
            if (updateResult.error?.includes('거래처를 찾을 수 없습니다')) {
              const createResult = await createClientInfo(clientInfoFormData);
              if (createResult.success && createResult.data) {
                currentClientId = createResult.data.id;
                setSelectedClientId(createResult.data.id);
              } else {
                alert(
                  '거래처 생성에 실패했습니다: ' +
                    (createResult.error || '알 수 없는 오류')
                );
                setIsSaving(false);
                return;
              }
            } else {
              alert(
                '거래처 정보 수정에 실패했습니다: ' +
                  (updateResult.error || '알 수 없는 오류')
              );
              // 거래처 수정 실패해도 세금계산서는 생성 계속 진행
            }
          }
        }
      }

      // 세금계산서 생성 (거래처 ID가 없어도 생성 가능)
      if (factoryId) {
        // writeDate를 YYYYMMDD 형식으로 변환
        const formatDateToYYYYMMDD = (dateString: string) => {
          if (!dateString) return '';
          // 0000-00-00 형식을 YYYYMMDD로 변환
          return dateString.replace(/-/g, '');
        };

        // ProductInfo에서 가져온 데이터 사용 - 모든 필드가 비어있는 라인은 제외
        const lineItems =
          productInfoFormData?.products
            ?.filter((p) => {
              // 품목명, 품목코드, 규격, 수량, 단가가 모두 비어있지 않은 경우만 포함
              return (
                (p.product_name && p.product_name.trim() !== '') ||
                (p.product_code && p.product_code.trim() !== '') ||
                (p.product_spec && p.product_spec.trim() !== '') ||
                (p.quantity && p.quantity > 0) ||
                (p.unitPrice && p.unitPrice > 0)
              );
            })
            ?.map((p, index) => ({
              id: index + 1, // 순번 ID
              product_id: p.productId || null, // 제품 ID
              name: p.product_name || '', // 품목명
              code: p.product_code || null, // 품목 코드
              information: p.product_spec || '', // 규격
              chargeable_unit: p.quantity.toString() || '0', // 수량
              unit_price: p.unitPrice.toString() || '0', // 단가
              amount:
                ((p.quantity || 0) * (p.unitPrice || 0)).toString() || '0', // 공급가액
              tax:
                ((p.quantity || 0) * (p.unitPrice || 0) * 0.1).toString() ||
                '0', // 세액
            })) || [];

        const taxInvoiceData: CreateTaxInvoiceModel = {
          tax_id: taxId,
          factory: factoryId,
          client: currentClientId || null, // 거래처 ID가 없으면 null
          line_items: lineItems,
          tax_invoice_type: 'sales', // 항상 매출 세금계산서
          transaction_type: transactionType,
          // transaction_date: sellerInfoFormData?.writeDate || '',
          transaction_amount: lineItems.reduce(
            (sum, item) => sum + Number(item.amount),
            0
          ),
          tax_amount: lineItems.reduce(
            (sum, item) => sum + Number(item.tax),
            0
          ),
          is_hidden: false,
        };

        const result = await handleCreateTaxInvoice(taxInvoiceData);
        if (!result) {
          setIsSaving(false);
          return;
        }

        // 새로 생성된 세금계산서 ID를 부모에게 전달
        if (onTaxCreated && result.id) {
          onTaxCreated(result.id);
        }

        // 프로젝트 ID가 있으면 프로젝트와 세금계산서 연결
        if (projectId) {
          await linkTaxInvoice({
            project_id: projectId,
            tax_id: result.id,
          });
        }
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다: ' + error);
    } finally {
      setIsSaving(false);
    }
  };

  // 발행방식 선택 버튼 클릭 핸들러
  const handleIssueTypeDropdownOpen = async () => {
    // 판매처, 거래처, 주문품목 정보 모두 유효해야 드롭다운 열기
    if (!isSellerInfoValid || !isClientInfoValid || !isProductInfoValid) {
      forceShowErrors.current = true;
      setShowErrors(true);
      return;
    }

    // 바로빌 상태 확인 및 회원가입 처리
    try {
      const isReady = await checkBarobill();

      if (!isReady) {
        alert('바로빌 회원가입에 실패했습니다. 다시 시도해주세요.');
        return;
      }
    } catch (error) {
      console.error('바로빌 회원가입 실패:', error);
      alert('바로빌 회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      return;
    }

    // 폼이 유효하고 바로빌이 준비되면 에러 표시 해제하고 드롭다운 열기
    forceShowErrors.current = false;
    setShowErrors(false);
    setIsIssueTypeDropdownOpen(!isIssueTypeDropdownOpen);
  };

  // 품목 추가 핸들러
  const handleAddProduct = (action: 'existing' | 'new') => {
    if (action === 'existing') {
      // 기존 품목 추가 - ProductInfo에 새로운 행 추가
      productInfoRef.current?.addProduct();
    } else if (action === 'new') {
      // 새로운 품목 추가 - 품목 상세 모달 열기
      setIsProductDetailOpen(true);
    }
    setIsAddProductDropdownOpen(false);
  };

  // 헤더 버튼 구성
  const headerButton = (
    <div className="flex gap-2">
      <MiniBtn
        text="임시 저장"
        textColor="text-primary"
        bgColor="bg-primary-8"
        hoverColor="hover:bg-secondary-hover"
        onClick={() => {
          handleTemporarySave('receipt', projectId);
          onClose();
        }}
        disabled={
          // 견적서에서 세금계산서로 들어왔을 때는 isDirty가 아니어도 저장 가능
          (taxId &&
            !isSellerInfoDirty &&
            !isClientInfoDirty &&
            !isProductInfoDirty) ||
          isSaving
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
            !isProductInfoValid ||
            isSaving
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
      <Panel
        title="세금계산서"
        onClose={onClose}
        headerButton={headerButton}
        ref={panelRef}
      >
        <div className="flex gap-5">
          <SellerInfo
            onFormChange={handleSellerInfoChange}
            showErrors={showErrors}
          />
          <ClientInfo
            onFormChange={handleClientInfoChange}
            showErrors={showErrors}
            initialData={initialClientData}
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
                  onSelect={handleAddProduct}
                />
              </div>
            )}
          </div>
          <ProductInfo
            ref={productInfoRef}
            setIsProductDetailOpen={setIsProductDetailOpen}
            isProductDetailOpen={isProductDetailOpen}
            onFormChange={handleProductInfoChange}
            initialProducts={initialProducts}
          />
        </div>
      </Panel>

      {/* 세금계산서 생성 모달 */}
      {isClaimTaxModalOpen && selectedIssueType && (
        <ClaimReceiptTaxModal
          onClose={handleModalClose}
          issueType={selectedIssueType}
          handleTemporarySave={handleTemporarySave}
          setIsEditingMode={setIsEditingMode || (() => {})}
        />
      )}

      {/* 바로빌 등록 실패 토스트 */}
      {/* {isToastOpen && (
        <Toast
          icon={<WarningCircle size={20} className="text-red" />}
          text="세금계산서 사용자 확인에 실패했습니다."
          subtext={errorMessage || '다시 시도해 주세요.'}
          type="red"
          isVisible={isVisible}
        />
      )} */}
    </>
  );
};

export default CreatTaxPanel;
