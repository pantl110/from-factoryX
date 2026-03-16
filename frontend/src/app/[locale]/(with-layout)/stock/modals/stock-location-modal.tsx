import DropzoneArea from '@/ui/dropzone-area';
import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { X } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { LocationModel } from '@/types/data-model';
import { useLocation, useUploadFile } from '@/hooks';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useTranslations } from 'next-intl';

export interface StagedLocationDataModel {
  location: string;
  detail_location?: string;
  memo?: string;
  images: string[];
}

interface StockLocationModalProps {
  mode: 'add' | 'update';
  selectedLocation?: LocationModel | null;
  productId?: number | null;
  materialId?: number | null;
  onClose: () => void;
  onSuccess?: () => void;
  onStage?: (data: StagedLocationDataModel) => void;
}

interface LocationFormModel {
  location: string;
  detail_location: string;
  memo: string;
  images: string[];
}

const StockLocationModal = ({
  mode,
  selectedLocation,
  productId,
  materialId,
  onClose,
  onSuccess,
  onStage,
}: StockLocationModalProps) => {
  const t = useTranslations('stock.stockLocation.modal');
  const tCommon = useTranslations('common');
  const { createLocation, updateLocation, isLoading } = useLocation();
  const { uploadMultipleFiles } = useUploadFile();
  const role = useMemberStore((state) => state.role);
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );
  const canEdit = role !== 'viewer' && hasSubscription();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LocationFormModel>({
    defaultValues: {
      location: selectedLocation?.location || '',
      detail_location: selectedLocation?.detail_location || '',
      memo: selectedLocation?.memo || '',
      images: selectedLocation?.images || [],
    },
  });

  const [images, setImages] = useState<string[]>(
    selectedLocation?.images || []
  );

  // selectedLocation이 변경되면 폼에 값 채우기
  useEffect(() => {
    if (selectedLocation) {
      reset({
        location: selectedLocation.location || '',
        detail_location: selectedLocation.detail_location || '',
        memo: selectedLocation.memo || '',
        images: selectedLocation.images || [],
      });
      setImages(selectedLocation.images || []);
    } else {
      reset({
        location: '',
        detail_location: '',
        memo: '',
        images: [],
      });
      setImages([]);
    }
  }, [selectedLocation, reset]);

  const onSubmit = async (data: LocationFormModel) => {
    try {
      if (mode === 'add') {
        // 추가 모드
        const id = materialId || productId;
        if (!id) {
          // 제품이 아직 생성되지 않은 경우: staging으로 임시 저장
          if (onStage) {
            onStage({
              location: data.location,
              detail_location: data.detail_location || undefined,
              memo: data.memo.trim() === '' ? undefined : data.memo,
              images,
            });
            onClose();
          }
          return;
        }

        const type = materialId ? 'material' : 'product';

        const result = await createLocation({
          type,
          id: id as number,
          location: data.location,
          detail_location: data.detail_location || undefined,
          memo: data.memo.trim() === '' ? '' : data.memo || undefined,
          images,
        });

        if (result.success) {
          onSuccess?.();
          onClose();
        }
      } else {
        // 수정 모드
        if (!selectedLocation?.id) {
          return;
        }

        const type = materialId ? 'material' : 'product';

        const result = await updateLocation(selectedLocation.id, {
          type,
          location: data.location,
          detail_location: data.detail_location || undefined,
          memo: data.memo.trim() === '' ? '' : data.memo || undefined,
          images,
        });

        if (result.success) {
          onSuccess?.();
          onClose();
        }
      }
    } catch {
      // 에러 처리 필요시 추가
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setValue('images', newImages);
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    try {
      // 파일 업로드
      const uploadResults = await uploadMultipleFiles(files);

      // 업로드 성공한 파일들의 URL만 추출
      const uploadedUrls = uploadResults
        .filter(
          (result: { success: boolean; object_url?: string; error?: string }) =>
            result.success && result.object_url
        )
        .map(
          (result: { success: boolean; object_url?: string; error?: string }) =>
            result.object_url || ''
        );

      if (uploadedUrls.length === 0) {
        // 업로드 실패한 경우
        console.error('파일 업로드에 실패했습니다.');
        throw new Error('파일 업로드에 실패했습니다.');
      }

      // 기존 이미지와 새로 업로드된 이미지 합치기
      const newImages = [...images, ...uploadedUrls];
      setImages(newImages);
      setValue('images', newImages);
    } catch (error) {
      // 에러 처리
      console.error('파일 업로드 중 오류가 발생했습니다:', error);
      throw error; // 에러를 다시 throw하여 DropzoneArea에서 처리할 수 있도록
    }
  };

  return (
    <Modal
      onClose={onClose}
      title={mode === 'add' ? t('title.add') : t('title.update')}
      width="w-[800px]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 mt-4">
          <Input
            label={t('labels.warehouseLocationName')}
            required
            placeholder={t('placeholders.warehouseLocationName')}
            value={watch('location')}
            {...register('location', { required: true })}
            showError={!!errors.location}
            errorMessage={
              errors.location
                ? t('errors.warehouseLocationNameRequired')
                : undefined
            }
            disabledReadOnly={!canEdit}
          />
          <Input
            label={t('labels.detailLocation')}
            placeholder={t('placeholders.detailLocation')}
            value={watch('detail_location')}
            {...register('detail_location')}
            disabledReadOnly={!canEdit}
          />
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-1 h-5">
              <label htmlFor="memo" className="Heading-5 text-sv">
                {t('labels.memo')}
              </label>
            </div>
            <textarea
              id="memo"
              rows={4}
              placeholder={t('placeholders.memo')}
              {...register('memo')}
              className="w-full p-2 border border-lg rounded-[8px] resize-none focus:border-primary placeholder:text-sv "
              disabled={!canEdit}
            />
          </div>

          {/* 창고 사진 */}

          <div className="flex flex-col gap-2 w-full">
            {!canEdit && images.length > 0 && (
              <label htmlFor="warehouse-photos" className="Heading-5 text-sv">
                {t('labels.warehousePhotos')}
              </label>
            )}

            {images.length < 10 && canEdit && (
              <DropzoneArea
                variant="location"
                fileCount={10 - images.length}
                onClose={onClose}
                accept={{
                  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
                }}
                onComplete={handleFileUpload}
              />
            )}

            {images.length > 0 && (
              <div className="flex gap-2.5 flex-wrap">
                {images.map((imageUrl, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={imageUrl}
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded-[8px] border border-lg"
                      alt={t('imageAlt', { index: index + 1 })}
                      quality={100}
                      unoptimized={true}
                    />
                    {canEdit && (
                      <button
                        type="button"
                        className="rounded-full bg-wh absolute -top-[5px] -right-[8px] w-5 h-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] flex items-center justify-center hover:bg-lg"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X size={14} className="text-sv" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex justify-end gap-2.5 mt-2.5">
            <MiniBtn
              text={tCommon('cancel')}
              variant="white"
              onClick={onClose}
              type="button"
            />
            <MiniBtn
              text={tCommon('save')}
              variant="primary"
              type="submit"
              disabled={isLoading}
            />
          </div>
        )}
      </form>
    </Modal>
  );
};

export default StockLocationModal;
