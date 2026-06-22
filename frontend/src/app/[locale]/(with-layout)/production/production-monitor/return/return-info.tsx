import { useTranslations } from 'next-intl';
import InfoLabelValue from '@/ui/info-label-value';
import MiniBtn from '@/ui/mini-btn';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import RegisterProductionModal from '../modals/register-production-modal';
import { RefundModel } from '@/types/data-model';
import { formatDate } from '@/utils/format-number';
import useMemberStore from '@/store/member-store';

interface RefundFormDataModel {
  refund_date: string;
  amount: number | null;
  production_amount: number | null;
}

interface ReturnInfoProps {
  refundData: RefundModel;
  onAmountChange: (newAmount: number | null) => void;
  onProductionAmountChange: (newProductionAmount: number | null) => void;
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
  const t = useTranslations('production.returnInfo');
  const tCommon = useTranslations('common');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';

  const [isRegisterProductionModalOpen, setIsRegisterProductionModalOpen] =
    useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [productionAmountInput, setProductionAmountInput] =
    useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');

  const { watch, setValue } = useForm<RefundFormDataModel>({
    defaultValues: {
      refund_date: refundData.refund_date || '',
      amount: refundData.amount,
      production_amount: refundData.production_amount ?? null,
    },
    mode: 'onChange', // 실시간 유효성 검사
  });

  const watchedAmount = watch('amount');
  const watchedProductionAmount = watch('production_amount');
  const watchedRefundDate = watch('refund_date');

  // 편집 모드 진입 시 생산수량 입력 필드 초기값 설정
  useEffect(() => {
    if (isEditing) {
      if (
        watchedProductionAmount === null ||
        watchedProductionAmount === undefined
      ) {
        setProductionAmountInput('');
      } else if (watchedProductionAmount === 0) {
        setProductionAmountInput('0');
      } else {
        setProductionAmountInput(formatNumber(watchedProductionAmount));
      }
    }
  }, [isEditing, watchedProductionAmount]);

  // 편집 모드 진입 시 반품수량 입력 필드 초기값 설정
  useEffect(() => {
    if (isEditing) {
      if (watchedAmount === null || watchedAmount === undefined) {
        setAmountInput('');
      } else if (watchedAmount === 0) {
        setAmountInput('0');
      } else {
        setAmountInput(formatNumber(watchedAmount));
      }
    }
  }, [isEditing, watchedAmount]);

  // 폼 유효성 검사
  const isFormValid =
    watchedRefundDate &&
    watchedAmount !== null &&
    watchedAmount !== undefined &&
    watchedAmount > 0 &&
    watchedProductionAmount !== null &&
    watchedProductionAmount !== undefined &&
    watchedProductionAmount >= 0;
  // && watchedProductionAmount + refundData.current_stock >= watchedAmount;

  // 숫자를 000,000 형식으로 포맷팅하는 함수
  const formatNumber = (value: number): string => {
    return value.toLocaleString();
  };

  // 생산수량 입력 처리 - 실시간 포맷팅
  const handleProductionAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = e.target;
    setProductionAmountInput(value);

    // 빈 문자열이면 null로 설정
    if (value === '') {
      setValue('production_amount', null);
      onProductionAmountChange(null);
      return;
    }

    // 쉼표 제거 후 숫자만 추출
    const numericValue = parseInt(value.replace(/,/g, ''));

    if (!isNaN(numericValue) && numericValue >= 0) {
      setValue('production_amount', numericValue);
      onProductionAmountChange(numericValue); // 부모에게 알림
    }
  };

  // 생산수량 입력 필드 blur 처리
  const handleProductionAmountBlur = () => {
    // 빈 문자열이면 null로 설정
    if (productionAmountInput === '') {
      setValue('production_amount', null);
      onProductionAmountChange(null);
      setProductionAmountInput('');
    } else {
      // 입력값이 있으면 포맷팅하여 표시
      const numericValue = parseInt(productionAmountInput.replace(/,/g, ''));
      if (!isNaN(numericValue) && numericValue >= 0) {
        setProductionAmountInput(formatNumber(numericValue));
      }
    }
  };

  // 반품수량 입력 처리 - 실시간 포맷팅
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setAmountInput(value);

    // 빈 문자열이면 null로 설정
    if (value === '') {
      setValue('amount', null);
      onAmountChange(null);
      return;
    }

    // 쉼표 제거 후 숫자만 추출
    const numericValue = parseInt(value.replace(/,/g, ''));

    if (!isNaN(numericValue) && numericValue >= 0) {
      setValue('amount', numericValue);
      onAmountChange(numericValue);
    }
  };

  // 반품수량 입력 필드 blur 처리
  const handleAmountBlur = () => {
    // 빈 문자열이면 null로 설정
    if (amountInput === '') {
      setValue('amount', null);
      onAmountChange(null);
      setAmountInput('');
    } else {
      // 입력값이 있으면 포맷팅하여 표시
      const numericValue = parseInt(amountInput.replace(/,/g, ''));
      if (!isNaN(numericValue) && numericValue >= 0) {
        setAmountInput(formatNumber(numericValue));
      }
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
          <h3 className="Heading-3 text-dg flex items-center">{t('title')}</h3>
          <div className="flex gap-2.5">
            {!isEditing && (
              <MiniBtn variant="outline"
                text={tCommon('edit')}
                onClick={() => setIsEditing(true)}
                disabled={
                  isViewer ||
                  (refundData.plan?.id === null
                    ? false
                    : refundData.plan?.status &&
                      refundData.plan.status !== 'pending')
                }
              />
            )}

            <MiniBtn variant="secondary"
              text={t('registerProductionButton')}
              onClick={() => setIsRegisterProductionModalOpen(true)}
              disabled={
                isViewer ||
                !isFormValid ||
                (refundData.plan?.id === null
                  ? false
                  : refundData.plan?.status &&
                    refundData.plan.status !== 'pending')
              }
            />
          </div>
        </div>

        <div>
          <div className="border-t border-b border-lg">
            <InfoLabelValue
              label={t('returnProduct')}
              value={refundData.product.name}
              disabled={true}
            />
          </div>
          <div className="border-b border-lg">
            {isEditing ? (
              <div className="flex w-full Me_Body-3 border-t border-lg">
                <div className="w-[137px] bg-bg flex gap-2 p-3">
                  <div className="text-sv">{t('returnDate')}</div>
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
                label={t('returnDate')}
                value={formatDate(watchedRefundDate)}
                isEditing={isEditing}
                disabled={true}
              />
            )}
          </div>
          <div className="border-b border-lg">
            {isEditing ? (
              <div className="flex w-full Me_Body-3 border-t border-lg">
                <div className="w-[137px] bg-bg flex gap-2 p-3">
                  <div className="text-sv">{t('returnQuantity')}</div>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="text-dg px-3 flex-1 flex items-center">
                    <div className="flex items-center w-full">
                      <input
                        type="text"
                        value={amountInput}
                        onChange={handleAmountChange}
                        onBlur={handleAmountBlur}
                        placeholder={tCommon('required')}
                        className="w-full placeholder:text-gr"
                        style={{ outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <InfoLabelValue
                label={t('returnQuantity')}
                value={refundData.amount.toLocaleString()}
                isEditing={isEditing}
                disabled={true}
              />
            )}
          </div>
          <div className="border-b border-lg">
            <InfoLabelValue
              label={tCommon('currentStock')}
              value={refundData.current_stock?.toLocaleString() || '-'}
              disabled={true}
            />
          </div>
          <div className="border-b border-lg">
            {isEditing ? (
              <div className="flex w-full Me_Body-3 border-t border-lg">
                <div className="w-[137px] bg-bg flex gap-2 p-3">
                  <div className="text-sv">{t('productionQuantity')}</div>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="text-dg px-3 flex-1 flex items-center">
                    <div className="flex items-center w-full">
                      <input
                        type="text"
                        value={productionAmountInput}
                        onChange={handleProductionAmountChange}
                        onBlur={handleProductionAmountBlur}
                        placeholder={tCommon('required')}
                        className="w-full placeholder:text-gr"
                        style={{ outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <InfoLabelValue
                label={t('productionQuantity')}
                value={
                  refundData.production_amount !== null &&
                  refundData.production_amount !== undefined
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
            onTabChange?.(t('productionPlanTab'));
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
