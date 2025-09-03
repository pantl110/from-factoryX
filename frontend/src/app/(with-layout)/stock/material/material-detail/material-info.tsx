import { useGetMaterial } from '@/hooks';
import InfoLabelValue from '@/ui/info-label-value';
import { useEffect, forwardRef, useImperativeHandle } from 'react';
import { useForm, Controller, ControllerRenderProps } from 'react-hook-form';
import useMemberStore from '@/store/member-store';

interface MaterialInfoProps {
  materialId: number;
  onIsDirtyChange?: (isDirty: boolean) => void;
  onRequiredFilledChange?: (filled: boolean) => void;
}

export interface MaterialInfoModel {
  getValues: () => MaterialInfoFormModel;
  isDirty: boolean;
}

interface MaterialInfoFormModel {
  materialName: string;
  materialCode: string;
  size: string;
  unit: string;
  currentStock: string;
  minStock: string;
}

// Helper to remove commas
function uncomma(str: string) {
  return str.replace(/,/g, '');
}
// Helper to add commas (string only, safe for big numbers)
function addComma(num: string | number) {
  if (num === '' || num === undefined || num === null) return '';
  const str = String(num).replace(/,/g, '');
  // 소수점 이하도 지원하려면 아래 정규식 사용
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const MaterialInfo = forwardRef<MaterialInfoModel, MaterialInfoProps>(
  ({ materialId, onIsDirtyChange, onRequiredFilledChange }, ref) => {
    const role = useMemberStore((state) => state.role);
    const isViewer = role === 'viewer';

    const { getMaterialDetail } = useGetMaterial();
    const {
      control,
      reset,
      getValues,
      watch,
      formState: { isDirty },
    } = useForm<MaterialInfoFormModel>({
      defaultValues: {
        materialName: '',
        materialCode: '',
        size: '',
        unit: '',
        currentStock: '',
        minStock: '',
      },
    });

    useEffect(() => {
      if (onIsDirtyChange) {
        onIsDirtyChange(isDirty);
      }
    }, [isDirty, onIsDirtyChange]);

    // 필수값 충족 여부 변경 시 콜백
    const watchedRequired = watch([
      'materialName',
      'materialCode',
      'unit',
      'size',
    ]);
    useEffect(() => {
      if (onRequiredFilledChange) {
        const [materialName, materialCode, unit, size] =
          watchedRequired as string[];
        const isFilled =
          String(materialName || '').trim() !== '' &&
          String(materialCode || '').trim() !== '' &&
          String(unit || '').trim() !== '' &&
          String(size || '').trim() !== '';
        onRequiredFilledChange(isFilled);
      }
    }, [watchedRequired, onRequiredFilledChange]);

    useImperativeHandle(
      ref,
      () => ({
        getValues,
        isDirty,
      }),
      [getValues, isDirty]
    );

    useEffect(() => {
      const fetchDetail = async () => {
        const result = await getMaterialDetail(materialId);
        if (result && result.success && result.data) {
          const mat = result.data;
          reset({
            materialName: mat.name ?? '',
            materialCode: mat.code ?? '',
            size: mat.spec ?? '',
            unit: mat.unit ?? '',
            currentStock:
              mat.current_stock !== undefined && mat.current_stock !== null
                ? mat.current_stock.toString()
                : '',
            minStock:
              mat.standard_stock !== undefined && mat.standard_stock !== null
                ? mat.standard_stock.toString()
                : '',
          });
        }
      };
      fetchDetail();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [materialId]);

    return (
      <div className="flex flex-col">
        <div className="flex">
          <Controller
            name="materialName"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="자재명"
                value={field.value ?? '-'}
                handleChange={field.onChange}
                isEditing={!isViewer}
                required
                placeholder="(필수) 자재명을 입력하세요."
              />
            )}
          />
          <Controller
            name="materialCode"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="자재 코드"
                value={field.value ?? '-'}
                handleChange={field.onChange}
                isEditing={!isViewer}
                required
                placeholder="(필수) 자재 코드를 입력하세요."
              />
            )}
          />
        </div>
        <div className="flex">
          <Controller
            name="size"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="규격"
                value={field.value ?? '-'}
                handleChange={field.onChange}
                isEditing={!isViewer}
                required
                placeholder="(필수) 규격을 입력하세요."
              />
            )}
          />
          <Controller
            name="unit"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="단위"
                value={field.value ?? '-'}
                handleChange={field.onChange}
                isEditing={!isViewer}
                required
                placeholder="(필수) 단위를 입력하세요."
              />
            )}
          />
        </div>
        <div className="flex">
          <Controller
            name="currentStock"
            control={control}
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                MaterialInfoFormModel,
                'currentStock'
              >;
            }) => {
              const handleChangeCurrentStock = (
                e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
              ) => {
                const numValue = e.target.value.replace(/[^0-9]/g, '');
                field.onChange(numValue === '' ? '' : numValue);
              };
              return (
                <InfoLabelValue
                  label="현재 재고"
                  value={
                    field.value === undefined || field.value === null
                      ? ''
                      : field.value === '0'
                        ? '0'
                        : addComma(field.value)
                  }
                  isEditing={!isViewer}
                  placeholder="현재 재고 수량을 입력하세요."
                  inputType="text"
                  handleChange={handleChangeCurrentStock}
                />
              );
            }}
          />
          <Controller
            name="minStock"
            control={control}
            render={({
              field,
            }: {
              field: ControllerRenderProps<MaterialInfoFormModel, 'minStock'>;
            }) => {
              const handleChangeMinStock = (
                e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
              ) => {
                const numValue = e.target.value.replace(/[^0-9]/g, '');
                field.onChange(numValue === '' ? '' : numValue);
              };
              return (
                <InfoLabelValue
                  label="최소 재고"
                  value={
                    field.value === undefined || field.value === null
                      ? ''
                      : field.value === '0'
                        ? '0'
                        : addComma(field.value)
                  }
                  isEditing={!isViewer}
                  placeholder="최소 재고를 입력하세요."
                  inputType="text"
                  handleChange={handleChangeMinStock}
                />
              );
            }}
          />
        </div>
        <div className="flex">
          <Controller
            name="currentStock"
            control={control}
            render={({ field: { value: currentStock } }) => (
              <Controller
                name="minStock"
                control={control}
                render={({ field: { value: minStock } }) => {
                  const isValid =
                    currentStock !== '' &&
                    minStock !== '' &&
                    minStock !== undefined &&
                    minStock !== null &&
                    !isNaN(Number(uncomma(currentStock))) &&
                    !isNaN(Number(uncomma(minStock)));
                  const status = isValid
                    ? Number(uncomma(currentStock)) >= Number(uncomma(minStock))
                      ? '충분'
                      : '부족'
                    : '-';
                  return (
                    <InfoLabelValue
                      label="재고 상태"
                      value={status}
                      chip={
                        status === '충분' || status === '부족'
                          ? { status }
                          : undefined
                      }
                      isEditing={false}
                    />
                  );
                }}
              />
            )}
          />
        </div>
      </div>
    );
  }
);

MaterialInfo.displayName = 'MaterialInfo';

export default MaterialInfo;
