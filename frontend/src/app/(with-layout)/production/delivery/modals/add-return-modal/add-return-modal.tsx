'use client';

import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import SearchInput from '@/ui/search-input';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ProductNameDropdown } from '@/ui/dropdown/product-name-dropdown';
import {
  ProductResponseModel,
  QuotationProductDetailResponseModel,
  ProjectStatusType,
} from '@/types/data-model';
import { useInput, getToday, formatDate, useCreateRefund } from '@/hooks';

interface AddReturnModalProps {
  onClose: () => void;
  quotationProductData: QuotationProductDetailResponseModel[];
  onProjectStatusChange?: (status: ProjectStatusType) => void; // 프로젝트 상태 변경 콜백
  onTabChange?: (tab: string) => void; // 탭 변경 콜백
}

const AddReturnModal = ({
  onClose,
  quotationProductData: _quotationProductData,
  onProjectStatusChange,
  onTabChange,
}: AddReturnModalProps) => {
  const params = useParams();
  const projectId = parseInt(params.id as string, 10);

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
    validate: (v) => (!v ? '반품 수량을 입력해 주세요.' : ''),
    initialValue: '', // 빈 문자열로 초기화
  });

  // 날짜 입력 useInput 적용
  const {
    value: returnDate,
    error: returnDateError,
    handleChange: handleReturnDateChange,
  } = useInput({
    validate: (v) => (!v ? '반품 일자를 입력해 주세요.' : ''),
    initialValue: getToday(),
  });

  const [selectedProduct, setSelectedProduct] =
    useState<QuotationProductDetailResponseModel | null>(null);

  const [showSearchIcon, setShowSearchIcon] = useState(true);

  // 반품 생성 훅
  const { createRefund, isLoading: isCreateRefundLoading } = useCreateRefund();

  // 반품 등록 버튼 클릭 핸들러
  const handleSubmitRefund = async () => {
    if (!selectedProduct || !selectedProduct.productId) {
      alert('제품을 선택해주세요.');
      return;
    }

    if (!returnQuantity || !returnDate) {
      alert('반품 수량과 반품 일자를 입력해주세요.');
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
      onTabChange?.('생산 현황');

      onClose();
    } else {
      alert('반품 등록에 실패했습니다.');
    }
  };

  // 드롭다운에서 선택 시 두 상태를 각각 업데이트
  const handleSelectProduct = (item: ProductResponseModel) => {
    // QuotationProductDetailResponseModel로 변환
    const quotationProductData: QuotationProductDetailResponseModel = {
      productId: item.id,
      product_code: item.code,
      product_name: item.name,
      spec: item.spec,
      unit: item.unit,
      quantity: null,
      unit_price: null,
    };

    setSelectedProduct(quotationProductData);
    setProductName(item.name);
    setIsProductNameDropdownOpen(false);
    // 제품 선택 시 반품 수량을 자동으로 설정하지 않음 (사용자가 직접 입력하도록)
    setShowSearchIcon(false);
  };

  return (
    <Modal
      title="반품할 상품을 등록해 주세요."
      subtitle="반품할 제품명과 수량을 입력해 주세요."
      onClose={onClose}
      width="w-[600px]"
    >
      <div className="w-full mt-4 relative">
        <SearchInput
          placeholder="제품명 검색"
          width="w-full"
          value={productName}
          onChange={(value) => {
            setProductName(value);
            if (value.length > 0) {
              setIsProductNameDropdownOpen(true);
            } else {
              setIsProductNameDropdownOpen(false);
            }
          }}
          onFocus={() => {
            if (productName.length > 0) {
              setIsProductNameDropdownOpen(true);
            }
            setShowSearchIcon(true);
          }}
          onBlur={() =>
            setTimeout(() => setIsProductNameDropdownOpen(false), 150)
          }
          showIcon={showSearchIcon}
        />
        {isProductNameDropdownOpen && productName && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-[100] w-[551px]">
            <ProductNameDropdown
              searchTerm={productName}
              onSelect={handleSelectProduct}
              onClose={() => setIsProductNameDropdownOpen(false)}
              width="w-full"
            />
          </div>
        )}
      </div>
      <div className="w-full mt-4">
        <Input
          label="반품 수량"
          placeholder="반품할 수량을 입력해 주세요."
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
          label="반품 일자"
          placeholder="반품할 일자를 입력해 주세요."
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
        <MiniBtn
          text="취소"
          onClick={onClose}
          textColor="text-sv"
          hoverColor="hover:bg-bg"
        />
        <MiniBtn
          text="반품 등록"
          onClick={handleSubmitRefund}
          textColor="text-wh"
          bgColor="bg-primary"
          hoverColor="hover:bg-primary-hover"
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
