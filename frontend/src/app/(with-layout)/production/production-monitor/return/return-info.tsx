import InfoLabelValue from '@/ui/info-label-value';
import MiniBtn from '@/ui/mini-btn';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import RegisterProductionModal from '../modals/register-production-modal';
import { RefundModel } from '@/types/data-model';
import { formatDate } from '@/hooks/format-number';
import useMemberStore from '@/store/member-store';

interface RefundFormDataModel {
  refund_date: string;
  amount: number;
  production_amount: number;
}

interface ReturnInfoProps {
  refundData: RefundModel;
  onAmountChange: (newAmount: number) => void;
  onProductionAmountChange: (newProductionAmount: number) => void;
  onTabChange?: (tab: string) => void; // 탭 변경 콜백
  logId: number;
}

const ReturnInfo = ({
  refundData,
  onAmountChange,
  onProductionAmountChange,
  onTabChange,
  logId,
}: ReturnInfoProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';

  const [isRegisterProductionModalOpen, setIsRegisterProductionModalOpen] =
    useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { watch, setValue } = useForm<RefundFormDataModel>({
    defaultValues: {
      refund_date: refundData.refund_date || '',
      amount: refundData.amount,
      production_amount: refundData.production_amount || 0,
    },
    mode: 'onChange', // 실시간 유효성 검사
  });

  const watchedAmount = watch('amount');
  const watchedProductionAmount = watch('production_amount');
  const watchedRefundDate = watch('refund_date');

  // 폼 유효성 검사
  const isFormValid =
    watchedRefundDate &&
    watchedAmount >= 0 &&
    watchedProductionAmount >= 0 &&
    watchedProductionAmount + refundData.current_stock >= watchedAmount;

  // 숫자를 000,000 형식으로 포맷팅하는 함수
  const formatNumber = (value: number): string => {
    return value.toLocaleString();
  };

  // 생산수량 입력 처리 - 실시간 포맷팅
  const handleProductionAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = e.target;

    // 빈 문자열이면 0으로 설정
    if (value === '') {
      setValue('production_amount', 0);
      onProductionAmountChange(0);
      return;
    }

    // 쉼표 제거 후 숫자만 추출
    const numericValue = parseInt(value.replace(/,/g, '')) || 0;

    if (numericValue >= 0) {
      setValue('production_amount', numericValue);
      onProductionAmountChange(numericValue); // 부모에게 알림
    } else {
      // 음수 값이 입력되면 input을 비움
      setValue('production_amount', 0);
      onProductionAmountChange(0);
    }
  };

  // 반품수량 입력 처리 - 실시간 포맷팅
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    // 빈 문자열이면 0으로 설정
    if (value === '') {
      setValue('amount', 0);
      onAmountChange(0);
      return;
    }

    // 쉼표 제거 후 숫자만 추출
    const numericValue = parseInt(value.replace(/,/g, '')) || 0;

    if (numericValue >= 1) {
      setValue('amount', numericValue);
      onAmountChange(numericValue);
    } else if (numericValue === 0) {
      setValue('amount', 0);
      onAmountChange(0);
    } else {
      // 음수 값이 입력되면 input을 비움
      setValue('amount', 0);
      onAmountChange(0);
    }
  };

  // 반품일자 변경 처리
  const handleRefundDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const formatted = formatDate(value);
    setValue('refund_date', formatted);
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <h3 className="Heading-3 text-dg flex items-center">반품 정보</h3>
          <div className="flex gap-2.5">
            {!isEditing && (
              <MiniBtn
                text="수정"
                textColor="text-dg"
                borderColor="border-lg"
                hoverColor="hover:bg-bg"
                onClick={() => setIsEditing(true)}
                disabled={
                  isViewer ||
                  (refundData.plan?.id === null
                    ? false
                    : refundData.plan?.status &&
                      String(refundData.plan.status) !== '가동 대기')
                }
              />
            )}

            <MiniBtn
              text="생산 등록"
              hoverColor="hover:bg-primary-hover"
              textColor="text-wh"
              bgColor="bg-primary"
              onClick={() => setIsRegisterProductionModalOpen(true)}
              disabled={
                isViewer ||
                !isFormValid ||
                (refundData.plan?.id === null
                  ? false
                  : refundData.plan?.status &&
                    String(refundData.plan.status) !== '가동 대기')
              }
            />
          </div>
        </div>

        <div>
          <div className="border-t border-b border-lg">
            <InfoLabelValue
              label="반품품목"
              value={refundData.product.name}
              disabled={true}
            />
          </div>
          <div className="border-b border-lg">
            {isEditing ? (
              <div className="flex w-full Me_Body-1 border-t border-lg">
                <div className="w-[137px] bg-lg-table flex gap-2 p-3">
                  <div className="text-sv">반품일자</div>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="text-dg px-3 flex-1 flex items-center">
                    <div className="flex items-center w-full">
                      <input
                        type="text"
                        value={watchedRefundDate}
                        onChange={handleRefundDateChange}
                        placeholder="YYYY-MM-DD"
                        className="w-full placeholder:text-gr"
                        style={{ outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <InfoLabelValue
                label="반품일자"
                value={formatDate(watchedRefundDate)}
                isEditing={isEditing}
                disabled={true}
              />
            )}
          </div>
          <div className="border-b border-lg">
            {isEditing ? (
              <div className="flex w-full Me_Body-1 border-t border-lg">
                <div className="w-[137px] bg-lg-table flex gap-2 p-3">
                  <div className="text-sv">반품수량</div>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="text-dg px-3 flex-1 flex items-center">
                    <div className="flex items-center w-full">
                      <input
                        type="text"
                        value={formatNumber(watchedAmount)}
                        onChange={handleAmountChange}
                        placeholder="(필수)"
                        className="w-full placeholder:text-gr"
                        style={{ outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <InfoLabelValue
                label="반품수량"
                value={refundData.amount.toLocaleString()}
                isEditing={isEditing}
                disabled={true}
              />
            )}
          </div>
          <div className="border-b border-lg">
            <InfoLabelValue
              label="현재재고"
              value={refundData.current_stock?.toLocaleString() || '-'}
              disabled={true}
            />
          </div>
          <div className="border-b border-lg">
            {isEditing ? (
              <div className="flex w-full Me_Body-1 border-t border-lg">
                <div className="w-[137px] bg-lg-table flex gap-2 p-3">
                  <div className="text-sv">생산수량</div>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="text-dg px-3 flex-1 flex items-center">
                    <div className="flex items-center w-full">
                      <input
                        type="text"
                        value={formatNumber(watchedProductionAmount)}
                        onChange={handleProductionAmountChange}
                        placeholder="(필수)"
                        className="w-full placeholder:text-gr"
                        style={{ outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <InfoLabelValue
                label="생산수량"
                value={
                  refundData.production_amount
                    ? refundData.production_amount.toLocaleString()
                    : ''
                }
                isEditing={isEditing}
                disabled={true}
              />
            )}
          </div>
        </div>
      </div>

      {isRegisterProductionModalOpen && (
        <RegisterProductionModal
          onClose={() => setIsRegisterProductionModalOpen(false)}
          onSuccess={() => {
            // 생산 시작 성공 시 생산계획 탭으로 이동
            onTabChange?.('생산 계획');
          }}
          logId={logId}
          currentAmount={watchedAmount}
          currentProductionAmount={watchedProductionAmount}
          currentRefundDate={watchedRefundDate}
        />
      )}
    </>
  );
};

export default ReturnInfo;
