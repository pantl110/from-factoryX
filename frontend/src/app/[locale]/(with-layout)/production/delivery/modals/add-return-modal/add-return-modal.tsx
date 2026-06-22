'use client';

import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  QuotationProductDetailResponseModel,
  ProjectStatusType,
} from '@/types/data-model';
import { useInput, getToday, formatDate, useCreateRefund } from '@/hooks';
import PlanProductsDropdown from './plan-products-dropdown';

interface AddReturnModalProps {
  onClose: () => void;
  onProjectStatusChange?: (status: ProjectStatusType) => void; // 프로젝트 상태 변경 콜백
  onTabChange?: (tab: string) => void; // 탭 변경 콜백
}

const AddReturnModal = ({
  onClose,
  onProjectStatusChange,
  onTabChange,
}: AddReturnModalProps) => {
  const params = useParams();
  const projectId = parseInt(params.id as string, 10);
  const tCommon = useTranslations('common');
  const tProduction = useTranslations('production.returnModal');

  // 숫자 포맷팅 함수 (000,000 형식)
  const formatNumberWithComma = (value: string): string => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (!numbers) return '';
    return parseInt(numbers, 10).toLocaleString();
  };

  const [productName, setProductName] = useState('');
  const [isProductNameDropdownOpen, setIsProductNameDropdownOpen] =
    useState(false);

  // input 검사 훅
  const {
    value: returnQuantity,
    error: returnQuantityError,
    handleChange: handleReturnQuantityChange,
  } = useInput({
    validate: (v) => (!v ? tProduction('returnQuantityError') : ''),
    initialValue: '', // 빈 문자열로 초기화
  });

  // 날짜 입력 useInput 적용
  const {
    value: returnDate,
    error: returnDateError,
    handleChange: handleReturnDateChange,
  } = useInput({
    validate: (v) => (!v ? tProduction('returnDateError') : ''),
    initialValue: getToday(),
  });

  const [selectedProduct, setSelectedProduct] =
    useState<QuotationProductDetailResponseModel | null>(null);

  // 반품 생성 훅
  const { createRefund, isLoading: isCreateRefundLoading } = useCreateRefund();

  // 반품 등록 버튼 클릭 핸들러
  const handleSubmitRefund = async () => {
    if (!selectedProduct || !selectedProduct.productId) {
      alert(tProduction('selectProductError'));
      return;
    }

    if (!returnQuantity || !returnDate) {
      alert(tProduction('inputError'));
      return;
    }

    const refundData = {
      project_id: projectId,
      product_id: selectedProduct.productId,
      refund_date: returnDate,
      refund_amount: parseInt(returnQuantity, 10) || 0,
    };

    const result = await createRefund(refundData);
    if (result.success) {
      // 반품 등록 성공 시 프로젝트 상태를 "생산중"으로 변경
      onProjectStatusChange?.('production');

      // 생산현황 탭으로 변경
      onTabChange?.(tProduction('productionStatusTab'));

      onClose();
    } else {
      alert(tProduction('registerError'));
    }
  };

  // 드롭다운에서 선택 시 두 상태를 각각 업데이트
  const handleSelectProduct = (item: { id: number; name: string }) => {
    // QuotationProductDetailResponseModel로 변환
    const quotationProductData: QuotationProductDetailResponseModel = {
      productId: item.id,
      product_code: '',
      product_name: item.name,
      spec: '',
      unit: '',
      quantity: null,
      unit_price: null,
    };

    setSelectedProduct(quotationProductData);
    setProductName(item.name);
    setIsProductNameDropdownOpen(false);
  };

  return (
    <Modal
      title={tProduction('title')}
      subtitle={tProduction('subtitle')}
      onClose={onClose}
      width="w-[600px]"
    >
      <div className="w-full mt-4 relative">
        <Input
          label={tCommon('productName')}
          placeholder={tProduction('productNamePlaceholder')}
          required
          value={productName || ''}
          disabledReadOnly
          button={true}
          onClickButton={() => setIsProductNameDropdownOpen(true)}
        />
        {isProductNameDropdownOpen && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-[100] w-[551px]">
            <PlanProductsDropdown
              projectId={projectId}
              onClose={() => setIsProductNameDropdownOpen(false)}
              onSelect={handleSelectProduct}
            />
          </div>
        )}
      </div>
      <div className="w-full mt-4">
        <Input
          label={tProduction('returnQuantity')}
          placeholder={tProduction('returnQuantityPlaceholder')}
          required
          value={formatNumberWithComma(returnQuantity)}
          onChange={(e) => {
            const rawValue = e.target.value.replace(/[^0-9.]/g, '');
            // 소수점이 여러 개 입력되는 것을 방지
            const parts = rawValue.split('.');
            const cleanValue =
              parts.length > 2
                ? parts[0] + '.' + parts.slice(1).join('')
                : rawValue;
            handleReturnQuantityChange(cleanValue);
          }}
          showError={!!returnQuantityError}
          type="text"
        />
      </div>
      <div className="w-full mt-4">
        <Input
          label={tProduction('returnDate')}
          placeholder={tProduction('returnDatePlaceholder')}
          required
          value={returnDate}
          onChange={(e) => {
            const formatted = formatDate(e.target.value);
            handleReturnDateChange(formatted);
          }}
          showError={!!returnDateError}
        />
      </div>
      <div className="flex gap-2.5 mt-4 justify-end">
        <MiniBtn variant="white"
          text={tCommon('cancel')}
          onClick={onClose}
        />
        <MiniBtn variant="primary"
          text={tProduction('register')}
          onClick={handleSubmitRefund}
          disabled={
            isCreateRefundLoading ||
            !selectedProduct ||
            !returnQuantity ||
            !returnDate
          }
        />
      </div>
    </Modal>
  );
};

export default AddReturnModal;
