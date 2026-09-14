'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Panel, MiniBtn, PanelRefModel, Toast } from '@/ui';
import SellerInfo from './seller-info';
import ClientInfo from './client-info';
import { CaretDown } from '@phosphor-icons/react/dist/ssr';
import AddItemDropdown from './add-item-dropdown';
import ClaimReceiptTaxModal from './claim-receipt-tax-modal';
import IssueTypeDropdown from './issue-type-dropdown';
import {
  useUpdateFactory,
  useCreateTaxInvoice,
  useCreateClient,
  useUpdateClient,
  useLinkTaxInvoice,
  useToast,
  useCheckBarobill,
  usePublishTaxInvoice,
} from '@/hooks';
import type { CreateClientResultType } from '@/hooks';
import useMemberStore from '@/store/member-store';
import {
  FactoriesUpdateModel,
  CreateTaxInvoiceModel,
  ClientModel,
  ClientUpdateModel,
  TaxClientInfoModel,
} from '@/types/data-model';
import { TaxType, TransactionType } from '@/types/status-type';
import { ClientInfoFormDataModel, SellerInfoFormDataModel } from '../type';
import ProductInfo, {
  ProductInfoRefModel,
  ProductFormDataModel,
} from './product-info';
import { WarningCircle, CheckCircle } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

// 세금계산서 편집용 제품 데이터 타입
interface TaxProductEditModel {
  productId: number;
  quantity: number;
  unit_price: number;
  product_name: string;
  product_code: string;
  product_spec: string;
  tax_type?: Exclude<TaxType, 'unclassified'>;
}

interface CreatTaxPanelProps {
  onClose: () => void;
  taxId?: number;
  initialTaxType?: TaxType;
  initialZeroRatedReason?: string;
  initialClientData?: TaxClientInfoModel;
  initialProducts?: TaxProductEditModel[];
  setIsEditingMode?: (isEditingMode: boolean) => void;
  onTaxCreated?: (taxId: number) => void; // 새로 생성된 세금계산서 ID 전달
  projectId?: number;
}

const CreatTaxPanel = ({
  onClose,
  taxId,
  initialTaxType,
  initialZeroRatedReason = '',
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
    'invoice' | 'receipt' | null
  >(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false); // 새로운 제품 추가 디테일판넬 상태

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

  // 주문제품 정보 폼 상태
  const [isProductInfoDirty, setIsProductInfoDirty] = useState(false);
  const [isProductInfoValid, setIsProductInfoValid] = useState(false);
  const [productInfoFormData, setProductInfoFormData] =
    useState<ProductFormDataModel | null>(null);
  const [isZeroRatedTransaction, setIsZeroRatedTransaction] = useState(
    initialTaxType === 'zero_rated'
  );
  const [zeroRatedReason, setZeroRatedReason] = useState(
    initialZeroRatedReason
  );
  const [isTaxTypeDirty, setIsTaxTypeDirty] = useState(false);

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
  const { publishTaxInvoice } = usePublishTaxInvoice();
  // 생성된 세금계산서 id 보관 (모달 확인 시 생성 후 발행에 사용)
  const createdTaxIdRef = useRef<number | null>(null);
  // 생성 후 id를 기억 → 재시도 시 새로 생성하지 않고 수정되도록(중복 임시저장 방지)
  const [currentTaxId, setCurrentTaxId] = useState<number | undefined>(taxId);
  useEffect(() => {
    setCurrentTaxId(taxId);
  }, [taxId]);

  const { linkTaxInvoice } = useLinkTaxInvoice();
  const { checkBarobill } = useCheckBarobill();

  // 토스트 훅
  const { showToast, isToastOpen, isVisible } = useToast();
  const [errorText, setErrorText] = useState('');
  const [errorSubtext, setErrorSubtext] = useState('');
  const [toastType, setToastType] = useState<'red' | 'primary'>('red');
  const [showWriteDateError, setShowWriteDateError] = useState(false); // 작성일자만 에러 표시

  const factoryId = useMemberStore((state) => state.factoryId);
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const t = useTranslations('tax.createTaxPanel');
  const tTax = useTranslations('tax');
  const tCommon = useTranslations('common');
  const productTaxTypes = useMemo(
    () =>
      Array.from(
        new Set(
          (productInfoFormData?.products ?? [])
            .map((product) => product.tax_type)
            .map((taxType) => (taxType === 'zero_rated' ? 'taxable' : taxType))
            .filter((taxType): taxType is 'taxable' | 'exempt' =>
              Boolean(taxType)
            )
        )
      ),
    [productInfoFormData]
  );
  const hasMixedTaxTypes = productTaxTypes.length > 1;
  const hasExemptProducts = productTaxTypes.includes('exempt');
  const initialMasterTaxType =
    initialTaxType === 'exempt' ? 'exempt' : 'taxable';
  const selectedTaxType: TaxType = isZeroRatedTransaction
    ? 'zero_rated'
    : hasMixedTaxTypes
      ? 'unclassified'
      : (productTaxTypes[0] ?? initialMasterTaxType);
  const isZeroRatedReasonMissing =
    isZeroRatedTransaction && zeroRatedReason.trim().length === 0;
  const taxDocumentLabel =
    selectedTaxType === 'exempt'
      ? t('taxType.invoice')
      : t('taxType.taxInvoice');
  const selectedDocumentKind =
    selectedTaxType === 'exempt' ? 'invoice' : 'tax_invoice';

  useEffect(() => {
    setIsZeroRatedTransaction(initialTaxType === 'zero_rated');
    setZeroRatedReason(initialZeroRatedReason);
    setIsTaxTypeDirty(false);
  }, [initialTaxType, initialZeroRatedReason]);

  useEffect(() => {
    if (isZeroRatedTransaction && hasExemptProducts) {
      setIsZeroRatedTransaction(false);
      setZeroRatedReason('');
      setIsTaxTypeDirty(true);
      setToastType('red');
      setErrorText(t('taxType.zeroRatedExemptErrorTitle'));
      setErrorSubtext(t('taxType.zeroRatedExemptErrorSubtitle'));
      showToast();
    }
  }, [hasExemptProducts, isZeroRatedTransaction, showToast, t]);

  const handleZeroRatedToggle = () => {
    if (isViewer) return;
    if (!isZeroRatedTransaction && hasExemptProducts) {
      setToastType('red');
      setErrorText(t('taxType.zeroRatedExemptErrorTitle'));
      setErrorSubtext(t('taxType.zeroRatedExemptErrorSubtitle'));
      showToast();
      return;
    }

    setIsZeroRatedTransaction((current) => !current);
    if (isZeroRatedTransaction) setZeroRatedReason('');
    setIsTaxTypeDirty(true);
  };

  // 주문제품 정보 폼 변경 핸들러
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
          alert(result.error || t('errors.createTaxInvoiceFailed'));
          return false;
        }
      } catch (error) {
        alert(t('errors.createTaxInvoiceError') + error);
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createTaxInvoice]
  );

  // 발행방식 선택 핸들러
  const handleIssueTypeSelect = (issueType: 'invoice' | 'receipt') => {
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

  // 모달 "확인" — 세금계산서 생성(임시저장) 후 국세청 발행까지 진행
  const handleModalConfirm = async (transactionType: TransactionType) => {
    createdTaxIdRef.current = null;

    // 1) 생성(임시저장)
    const isSaved = await handleTemporarySave(transactionType);
    if (!isSaved) {
      // 생성 자체 실패: 에러 토스트 + 모달만 닫고 판넬 유지
      setToastType('red');
      setErrorText(t('toast.createFailTitle'));
      setErrorSubtext(t('toast.createFailSubtitle'));
      showToast();
      handleModalClose();
      return;
    }

    const taxId = createdTaxIdRef.current;
    if (!taxId) {
      // 생성은 됐으나 id를 못 얻음 → 임시저장 상태로 남김 + 에러 토스트
      setToastType('red');
      setErrorText(t('toast.publishFailTitle'));
      setErrorSubtext(t('toast.publishFailSavedSubtitle'));
      showToast();
      handleModalClose();
      return;
    }

    // 2) 국세청 발행
    const publishResult = await publishTaxInvoice(taxId);
    if (publishResult.success) {
      // 발행 성공: 성공 토스트 후 판넬 닫기
      // (토스트가 판넬 내부에 렌더링되므로, 보이도록 잠시 뒤 닫는다)
      setToastType('primary');
      setErrorText(t('toast.publishSuccessTitle'));
      setErrorSubtext(t('toast.publishSuccessSubtitle'));
      showToast();
      setIsEditingMode?.(false);
      handleModalClose();
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      // 발행 실패: 임시저장 상태로 남음(이미 생성됨) + 에러 토스트, 판넬 유지
      setToastType('red');
      setErrorText(t('toast.publishFailTitle'));
      setErrorSubtext(
        publishResult.error || t('toast.publishFailSavedSubtitle')
      );
      showToast();
      handleModalClose();
    }
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
      // 주문제품 정보의 유효성을 실제로 검증
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
    async (
      clientFormData: ClientInfoFormDataModel
    ): Promise<CreateClientResultType> => {
      if (!factoryId)
        return { success: false, error: t('errors.factoryIdNotSet') };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [factoryId, createClient]
  );

  // 거래처 정보 수정 함수
  const updateClientInfo = useCallback(
    async (clientId: number, clientFormData: ClientInfoFormDataModel) => {
      if (!factoryId)
        return { success: false, error: t('errors.factoryIdNotSet') };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [factoryId, updateClient]
  );

  // 작성날짜 유효성 검사 함수
  const isWriteDateValid = () => {
    if (!sellerInfoFormData?.writeDate) {
      return false;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const isValidFormat = dateRegex.test(sellerInfoFormData.writeDate);

    if (!isValidFormat) {
      return false;
    }

    // 실제 날짜 유효성 검사 (예: 2025-02-30 같은 잘못된 날짜 체크)
    const date = new Date(sellerInfoFormData.writeDate);
    const [year, month, day] = sellerInfoFormData.writeDate
      .split('-')
      .map(Number);
    const isValidDate =
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      !isNaN(date.getTime());

    return isValidDate;
  };

  // 임시 저장 버튼 클릭 핸들러
  const handleTemporarySave = async (
    transactionType: TransactionType,
    projectId?: number
  ): Promise<boolean> => {
    if (hasMixedTaxTypes) {
      setToastType('red');
      setErrorText(t('taxType.mixedErrorTitle'));
      setErrorSubtext(t('taxType.mixedErrorSubtitle'));
      showToast();
      return false;
    }
    // 임시저장일 때는 작성날짜만 유효성 검사
    if (!isWriteDateValid()) {
      setShowWriteDateError(true); // 작성일자만 에러 표시
      setIsSaving(false);
      return false; // 실패 시 false 반환
    }

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
          if (createResult.success) {
            // 생성된 거래처 ID로 상태 업데이트 및 현재 ID 설정
            currentClientId = createResult.data.id;
            setSelectedClientId(createResult.data.id);
          } else {
            alert(
              t('errors.createClientFailed') +
                (createResult.error || t('errors.unknownError'))
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
              if (createResult.success) {
                currentClientId = createResult.data.id;
                setSelectedClientId(createResult.data.id);
              } else {
                alert(
                  t('errors.createClientFailed') +
                    (createResult.error || t('errors.unknownError'))
                );
                setIsSaving(false);
                return false;
              }
            } else {
              alert(
                t('errors.updateClientFailed') +
                  (updateResult.error || t('errors.unknownError'))
              );
              // 거래처 수정 실패해도 세금계산서는 생성 계속 진행
            }
          }
        }
      }

      // 세금계산서 생성 (거래처 ID가 없어도 생성 가능)
      if (factoryId) {
        // ProductInfo에서 가져온 데이터 사용 - 모든 필드가 비어있는 라인은 제외
        const lineItems =
          productInfoFormData?.products
            ?.filter((p) => {
              // 제품명, 제품코드, 규격, 수량, 단가가 모두 비어있지 않은 경우만 포함
              return (
                (p.product_name && p.product_name.trim() !== '') ||
                (p.product_code && p.product_code.trim() !== '') ||
                (p.product_spec && p.product_spec.trim() !== '') ||
                (p.quantity && p.quantity > 0) ||
                (p.unitPrice && p.unitPrice > 0)
              );
            })
            ?.map((p, index) => {
              const lineTaxType =
                selectedTaxType === 'unclassified'
                  ? (p.tax_type ?? 'taxable')
                  : selectedTaxType;

              return {
                id: index + 1, // 순번 ID
                product_id: p.productId || null, // 제품 ID
                tax_type: lineTaxType,
                name: p.product_name || '', // 제품명
                code: p.product_code || null, // 제품 코드
                information: p.product_spec || '', // 규격
                chargeable_unit: p.quantity.toString() || '0', // 수량
                unit_price: p.unitPrice.toString() || '0', // 단가
                amount:
                  ((p.quantity || 0) * (p.unitPrice || 0)).toString() || '0', // 공급가액
                tax:
                  Math.floor(
                    (p.quantity || 0) *
                      (p.unitPrice || 0) *
                      (lineTaxType === 'taxable' ? 0.1 : 0)
                  ).toString() || '0', // 세액 (원 미만 절사 — 국세청 홈택스 기준)
              };
            }) || [];

        const taxInvoiceData: CreateTaxInvoiceModel = {
          tax_id: currentTaxId,
          factory: factoryId,
          client: currentClientId || null, // 거래처 ID가 없으면 null
          line_items: lineItems,
          tax_invoice_type: 'sales', // 항상 매출 세금계산서
          document_kind: selectedDocumentKind,
          tax_type: selectedTaxType,
          zero_rated_reason: isZeroRatedTransaction
            ? zeroRatedReason.trim()
            : null,
          transaction_type: transactionType,
          transaction_date: sellerInfoFormData?.writeDate || '',
          transaction_amount: lineItems.reduce(
            (sum, item) => sum + Number(item.amount),
            0
          ),
          tax_amount: Math.floor(
            lineItems.reduce((sum, item) => sum + Number(item.tax), 0)
          ),
          is_hidden: false,
        };

        const result = await handleCreateTaxInvoice(taxInvoiceData);
        if (!result) {
          setIsSaving(false);
          return false;
        }

        // 프로젝트 ID가 있으면 프로젝트와 세금계산서 연결 (먼저 연결)
        if (projectId) {
          await linkTaxInvoice({
            project_id: projectId,
            tax_id: result.id,
          });
        }

        // 생성된 세금계산서 id 보관 (모달 확인 시 발행에 사용 + 재시도 시 중복 방지)
        if (result.id) {
          createdTaxIdRef.current = result.id;
          setCurrentTaxId(result.id);
        }

        // 새로 생성된 세금계산서 ID를 부모에게 전달 (연결 후 전달)
        if (onTaxCreated && result.id) {
          onTaxCreated(result.id);
        }
      }
    } catch (error) {
      alert(t('errors.saveError') + error);
      return false; // 에러 시 false 반환
    } finally {
      setIsSaving(false);
    }

    return true; // 성공 시 true 반환
  };

  // 발행방식 선택 버튼 클릭 핸들러
  const handleIssueTypeDropdownOpen = async () => {
    // 판매처, 거래처, 주문제품 정보 모두 유효해야 드롭다운 열기
    if (!isSellerInfoValid || !isClientInfoValid || !isProductInfoValid) {
      forceShowErrors.current = true;
      setShowErrors(true);
      return;
    }

    // 바로빌 상태 확인 및 회원가입 처리
    try {
      const isReady = await checkBarobill();

      if (!isReady) {
        setErrorText(t('errors.barobillCheckFailed'));
        setErrorSubtext(t('errors.tryAgain'));
        showToast();
        return;
      }
    } catch (error) {
      let errorMsg = t('errors.tryAgain');

      if (error instanceof Error) {
        // 에러 메시지에서 콜론 뒤의 부분만 추출
        const { message } = error;
        if (message.includes(':')) {
          errorMsg = message.split(':')[1]?.trim() || message;
        } else {
          errorMsg = message;
        }
      }
      setErrorText(t('errors.barobillCheckFailed'));
      setErrorSubtext(errorMsg);
      showToast();
      return;
    }

    // 폼이 유효하고 바로빌이 준비되면 에러 표시 해제하고 드롭다운 열기
    forceShowErrors.current = false;
    setShowErrors(false);
    setIsIssueTypeDropdownOpen(!isIssueTypeDropdownOpen);
  };

  // 제품 추가 핸들러
  const handleAddProduct = (action: 'existing' | 'new') => {
    if (action === 'existing') {
      // 기존 제품 추가 - ProductInfo에 새로운 행 추가
      productInfoRef.current?.addProduct();
    } else if (action === 'new') {
      // 새로운 제품 추가 - 제품 상세 모달 열기
      setIsProductDetailOpen(true);
    }
    setIsAddProductDropdownOpen(false);
  };

  // 헤더 버튼 구성
  const headerButton = (
    <div className="flex gap-2">
      <MiniBtn
        variant="gray"
        text={tTax('publishStatus.temporary')}
        onClick={async () => {
          const isSuccess = await handleTemporarySave('receipt', projectId);
          // 성공했을 때만 판넬 닫기
          if (isSuccess) {
            onClose();
          }
        }}
        disabled={
          // 견적서에서 세금계산서로 들어왔을 때는 isDirty가 아니어도 저장 가능
          (taxId &&
            !isSellerInfoDirty &&
            !isClientInfoDirty &&
            !isProductInfoDirty &&
            !isTaxTypeDirty) ||
          isSaving ||
          isViewer
        }
      />
      <div className="relative">
        <MiniBtn
          variant="secondary"
          text={t('buttons.selectIssueType')}
          icon={CaretDown}
          iconPosition="right"
          onClick={handleIssueTypeDropdownOpen}
          disabled={
            !hasSellerInfoRequiredValues ||
            !hasClientInfoRequiredValues ||
            !isProductInfoValid ||
            hasMixedTaxTypes ||
            isZeroRatedReasonMissing ||
            isSaving ||
            isViewer
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
        title={taxDocumentLabel}
        onClose={onClose}
        headerButton={headerButton}
        ref={panelRef}
      >
        <div className="flex gap-5">
          <SellerInfo
            onFormChange={handleSellerInfoChange}
            showErrors={showErrors}
            showWriteDateError={showWriteDateError}
            onWriteDateChange={() => setShowWriteDateError(false)}
          />
          <ClientInfo
            onFormChange={handleClientInfoChange}
            showErrors={showErrors}
            initialData={initialClientData}
          />
        </div>

        <div
          className={`mt-7 rounded-lg border px-5 py-4 ${
            hasMixedTaxTypes ? 'border-red bg-red-8' : 'border-lg bg-bg'
          }`}
        >
          <div className="flex items-center gap-4">
            <p className="Me_Body-2 text-dg">{t('taxType.label')}</p>
            <span className="rounded-md bg-white px-3 py-2 Me_Body-3 text-dg">
              {hasMixedTaxTypes
                ? t('taxType.mixed')
                : selectedTaxType === 'zero_rated'
                  ? t('taxType.zeroRated')
                  : selectedTaxType === 'exempt'
                    ? t('taxType.exempt')
                    : t('taxType.taxable')}
            </span>
            <p className="flex-1 Me_Body-3 text-sv">
              {hasMixedTaxTypes
                ? t('taxType.mixedDescription')
                : isZeroRatedTransaction
                  ? t('taxType.zeroRatedDescription')
                  : t('taxType.autoDescription')}
            </p>
            <div className="flex items-center gap-2">
              <span className="Me_Body-3 text-dg">
                {t('taxType.zeroRatedTransaction')}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isZeroRatedTransaction}
                aria-label={t('taxType.zeroRatedTransaction')}
                disabled={
                  isViewer || (!isZeroRatedTransaction && hasExemptProducts)
                }
                onClick={handleZeroRatedToggle}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  isZeroRatedTransaction ? 'bg-primary' : 'bg-lg'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                    isZeroRatedTransaction ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {isZeroRatedTransaction && (
            <div className="mt-4 border-t border-lg pt-4">
              <label htmlFor="zero-rated-reason" className="Me_Body-3 text-dg">
                {t('taxType.zeroRatedReasonLabel')}
                <span className="ml-1 text-red">*</span>
              </label>
              <input
                id="zero-rated-reason"
                type="text"
                maxLength={200}
                value={zeroRatedReason}
                onChange={(event) => {
                  setZeroRatedReason(event.target.value);
                  setIsTaxTypeDirty(true);
                }}
                placeholder={t('taxType.zeroRatedReasonPlaceholder')}
                disabled={isViewer}
                className={`mt-2 h-10 w-full rounded-md border bg-white px-3 Me_Body-3 text-dg outline-none ${
                  isZeroRatedReasonMissing ? 'border-red' : 'border-lg'
                }`}
              />
              <p className="mt-2 Me_Body-3 text-sv">
                {t('taxType.zeroRatedReasonHelp')}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-9">
          <div className="flex justify-between items-center w-full relative">
            <h3 className="Heading-3 h-10 items-center flex">
              {tCommon('orderProductInfo')}
            </h3>
            <MiniBtn
              variant="outline"
              text={`${tCommon('product')} ${tCommon('add')}`}
              icon={CaretDown}
              iconPosition="right"
              onClick={() => setIsAddProductDropdownOpen(true)}
              disabled={isViewer}
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
            initialTaxType={initialTaxType}
            overrideTaxType={isZeroRatedTransaction ? 'zero_rated' : undefined}
          />
        </div>
      </Panel>

      {/* 세금계산서 생성 모달 */}
      {isClaimTaxModalOpen && selectedIssueType && (
        <ClaimReceiptTaxModal
          onClose={handleModalClose}
          issueType={selectedIssueType}
          documentLabel={taxDocumentLabel}
          onConfirm={handleModalConfirm}
        />
      )}

      {/* 바로빌 등록 실패 토스트 */}
      {isToastOpen && (
        <Toast
          icon={
            toastType === 'primary' ? (
              <CheckCircle size={20} className="text-primary" />
            ) : (
              <WarningCircle size={20} className="text-red" />
            )
          }
          text={errorText}
          subtext={errorSubtext || t('errors.tryAgain')}
          type={toastType}
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default CreatTaxPanel;
