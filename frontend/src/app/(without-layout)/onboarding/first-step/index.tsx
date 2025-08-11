import { useEffect } from 'react';
import MiniBtn from '@/ui/mini-btn';
import Input from '@/ui/input';
import { useForm } from 'react-hook-form';
import { FirstStepFormDataModel } from '../types';
import useCreateSingleProduct from '@/hooks/stock/product/use-create-single-product';
import useUpdateProduct from '@/hooks/stock/product/use-update-product';
import useGetProduct from '@/hooks/stock/product/use-get-product';

interface FirstStepProps {
  onNextStep: () => void;
  onPrevStep: () => void;
}

const FirstStep = ({ onNextStep, onPrevStep }: FirstStepProps) => {
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
      // 품목 목록 조회
      const productListResult = await getProductList();

      if (!productListResult.success) {
        alert('품목 목록 조회에 실패했습니다: ' + productListResult.error);
        return;
      }

      const products = productListResult.data?.data || [];

      if (products.length === 0) {
        // 품목이 0개이면 새로 생성
        const result = await createSingleProduct({
          name: data.productName,
          code: data.productCode,
          spec: data.spec,
          unit: data.unit,
        });

        if (result.success) {
          // 생성된 품목의 ID를 sessionStorage에 저장
          sessionStorage.setItem(
            'onboarding-product-id',
            result.data?.product_id?.toString() || ''
          );
          onNextStep();
        } else {
          alert('품목 생성에 실패했습니다: ' + result.error);
        }
      } else {
        // 품목이 1개 이상이면 첫 번째 품목을 수정
        const firstProduct = products[0];
        const result = await updateProduct(firstProduct.id, {
          name: data.productName,
          code: data.productCode,
          spec: data.spec,
          unit: data.unit,
        });

        if (result.success) {
          // 수정된 품목의 ID를 sessionStorage에 저장
          sessionStorage.setItem(
            'onboarding-product-id',
            firstProduct.id.toString()
          );
          onNextStep();
        } else {
          alert('품목 수정에 실패했습니다: ' + result.error);
        }
      }
    } catch {
      alert('품목 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="bg-wh z-1 w-[800px] py-10 px-8 flex flex-col items-center rounded-lg">
      <div className="flex flex-col gap-8 w-full">
        {/* 타이틀 영역 */}
        <div className="flex flex-col gap-2 items-center">
          <h3 className="Heading-3 text-primary">
            등록할 품목 정보를 입력해주세요.
          </h3>
          <div className="Me_Body-2 text-bl text-center">
            운영을 시작하려면 먼저 품목과 설비 정보를 등록해야 해요.
            <br />
            등록이 완료되면 생산부터 재고까지 한눈에 관리할 수 있어요!
          </div>
        </div>

        {/* input container */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7">
          <div className="w-full flex flex-col gap-3 p-5 border border-lg rounded-xl shadow-[4px_4px_12px_-8px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col gap-2.5">
              <div className="flex gap-2.5 flex-1">
                <Input
                  label="품목명"
                  type="text"
                  placeholder="품목명을 입력하세요."
                  required={true}
                  {...register('productName', { required: true })}
                />
                <Input
                  label="품목 코드"
                  type="text"
                  placeholder="품목코드를 입력하세요."
                  required={true}
                  {...register('productCode', { required: true })}
                />
              </div>
              <div className="flex gap-2.5 flex-1">
                <Input
                  label="규격"
                  type="text"
                  placeholder="EX) 100 x300mmc"
                  required={true}
                  {...register('spec', { required: true })}
                />
                <Input
                  label="단위"
                  type="text"
                  placeholder="EX) EA"
                  required={true}
                  {...register('unit', { required: true })}
                />
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="w-full flex justify-end gap-2.5">
            <MiniBtn
              text="이전"
              textColor="text-sv"
              bgColor="bg-wh"
              hoverColor="hover:bg-bg"
              onClick={() => handlePrevStep(getValues())}
              disabled={isLoading}
            />
            <MiniBtn
              text="다음"
              textColor="text-wh"
              bgColor="bg-primary"
              hoverColor="hover:bg-primary-hover"
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
