import { useEffect } from 'react';
import MiniBtn from '@/ui/mini-btn';
import Input from '@/ui/input';
import { useForm } from 'react-hook-form';
import { FirstStepFormDataModel } from '../types';
import useCreateSingleProduct from '@/hooks/stock/product/use-create-single-product';
import useUpdateProduct from '@/hooks/stock/product/use-update-product';
import useGetProduct from '@/hooks/stock/product/use-get-product';
import { useTranslations } from 'next-intl';

interface FirstStepProps {
  onNextStep: () => void;
  onPrevStep: () => void;
}

const FirstStep = ({ onNextStep, onPrevStep }: FirstStepProps) => {
  const t = useTranslations('onboarding.firstStep');
  const tCommon = useTranslations('common');
  const { register, handleSubmit, reset, getValues, watch } =
    useForm<FirstStepFormDataModel>({
      defaultValues: {
        productName: '',
        productCode: '',
        spec: '',
        unit: '',
      },
      mode: 'onChange',
    });

  const { createSingleProduct, isLoading: isCreating } =
    useCreateSingleProduct();
  const { updateProduct, isLoading: isUpdating } = useUpdateProduct();
  const { getProductList, isLoading: isLoadingProductList } = useGetProduct();
  const isLoading = isCreating || isUpdating || isLoadingProductList;

  // 입력값 실시간 감지
  const values = watch();
  const isValid =
    !!values.productName &&
    !!values.productCode &&
    !!values.spec &&
    !!values.unit;

  // sessionStorage에서 데이터 복원
  useEffect(() => {
    const savedData = sessionStorage.getItem('onboarding-step1-product');

    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.productName !== undefined) {
          // 데이터 구조 확인
          reset(data);
        }
      } catch {
        // Silently ignore parsing errors
      }
    }
  }, [reset]);

  const saveFormData = (data: FirstStepFormDataModel) => {
    sessionStorage.setItem('onboarding-step1-product', JSON.stringify(data)); // sessionStorage에 저장
  };
  const handlePrevStep = (data: FirstStepFormDataModel) => {
    saveFormData(data);
    onPrevStep();
  };

  const onSubmit = async (data: FirstStepFormDataModel) => {
    saveFormData(data);

    try {
      // 제품 목록 조회
      const productListResult = await getProductList();

      if (!productListResult.success) {
        alert(t('errors.productListLoadFailed') + productListResult.error);
        return;
      }

      const products = productListResult.data?.data || [];

      if (products.length === 0) {
        // 제품이 0개이면 새로 생성
        const result = await createSingleProduct({
          name: data.productName,
          code: data.productCode,
          spec: data.spec,
          unit: data.unit,
        });

        if (result.success) {
          // 생성된 제품의 ID를 sessionStorage에 저장
          sessionStorage.setItem(
            'onboarding-product-id',
            result.data?.product_id?.toString() || ''
          );
          onNextStep();
        } else {
          alert(t('errors.productCreateFailed') + result.error);
        }
      } else {
        // 제품이 1개 이상이면 첫 번째 제품을 수정
        const firstProduct = products[0];
        const result = await updateProduct(firstProduct.id, {
          name: data.productName,
          code: data.productCode,
          spec: data.spec,
          unit: data.unit,
        });

        if (result.success) {
          // 수정된 제품의 ID를 sessionStorage에 저장
          sessionStorage.setItem(
            'onboarding-product-id',
            firstProduct.id.toString()
          );
          onNextStep();
        } else {
          alert(t('errors.productUpdateFailed') + result.error);
        }
      }
    } catch {
      alert(t('errors.productCreateError'));
    }
  };

  return (
    <div className="bg-wh z-1 w-[800px] py-10 px-8 flex flex-col items-center rounded-lg">
      <div className="flex flex-col gap-7 w-full">
        {/* 타이틀 영역 */}
        <h3 className="Heading-3 text-primary flex justify-center">
          {t('title')}
        </h3>

        {/* input container */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7">
          <div className="w-full flex flex-col gap-3 p-5 border border-lg rounded-xl shadow-[4px_4px_12px_-8px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col gap-2.5">
              <div className="flex gap-2.5 flex-1">
                <Input
                  label={tCommon('productName')}
                  type="text"
                  placeholder={tCommon('placeholders.productName')}
                  required={true}
                  {...register('productName', { required: true })}
                />
                <Input
                  label={tCommon('productCode')}
                  type="text"
                  placeholder={tCommon('placeholders.productCode')}
                  required={true}
                  {...register('productCode', { required: true })}
                />
              </div>
              <div className="flex gap-2.5 flex-1">
                <Input
                  label={tCommon('specification')}
                  type="text"
                  placeholder={t('spec.placeholder')}
                  required={true}
                  {...register('spec', { required: true })}
                />
                <Input
                  label={tCommon('unit')}
                  type="text"
                  placeholder={t('unit.placeholder')}
                  required={true}
                  {...register('unit', { required: true })}
                />
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="w-full flex justify-end gap-2.5">
            <MiniBtn
              text={t('buttons.previous')}
              variant="gray"
              type="button"
              onClick={() => handlePrevStep(getValues())}
            />
            <MiniBtn
              text={tCommon('next')}
              variant="secondary"
              type="submit"
              disabled={!isValid || isLoading}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default FirstStep;
