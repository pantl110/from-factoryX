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

interface StockLocationModalProps {
  mode: 'add' | 'update';
  selectedLocation?: LocationModel | null;
  productId?: number | null;
  materialId?: number | null;
  onClose: () => void;
  onSuccess?: () => void;
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
}: StockLocationModalProps) => {
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
          return;
        }

        const type = materialId ? 'material' : 'product';

        const result = await createLocation({
          type,
          id: id as number,
          location: data.location,
          detail_location: data.detail_location || undefined,
          memo: data.memo || undefined,
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
          memo: data.memo || undefined,
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

      // 기존 이미지와 새로 업로드된 이미지 합치기
      const newImages = [...images, ...uploadedUrls];
      setImages(newImages);
      setValue('images', newImages);
    } catch {
      // 에러 처리
    }
  };

  return (
    <Modal
      onClose={onClose}
      title={mode === 'add' ? '창고 위치 추가' : '창고 위치'}
      width="w-[800px]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 mt-4">
          <Input
            label="창고 위치명"
            required
            placeholder="A동 3층 렉 B-12"
            value={watch('location')}
            {...register('location', { required: true })}
            showError={!!errors.location}
            errorMessage={
              errors.location ? '창고 위치명을 입력해주세요.' : undefined
            }
            disabledReadOnly={!canEdit}
          />
          <Input
            label="상세 위치"
            placeholder="왼쪽 2번째 칸, 바닥에서 3번째 선반"
            value={watch('detail_location')}
            {...register('detail_location')}
            disabledReadOnly={!canEdit}
          />
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-1 h-5">
              <label htmlFor="memo" className="Heading-5 text-sv">
                메모
              </label>
            </div>
            <textarea
              id="memo"
              rows={4}
              placeholder="지게차 진입 불가, 소분 전용 구역 등"
              {...register('memo')}
              className="w-full p-2 border border-lg rounded-[8px] resize-none focus:outline-none focus:border-primary"
              disabled={!canEdit}
            />
          </div>

          {/* 창고 사진 */}

          <div className="flex flex-col gap-2 w-full">
            {!canEdit && images.length > 0 && (
              <label htmlFor="warehouse-photos" className="Heading-5 text-sv">
                창고 사진
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
                      alt={`창고 사진 ${index + 1}`}
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
          <div className="flex justify-end gap-2.5 mt-5">
            <MiniBtn
              text="취소"
              variant="white"
              onClick={onClose}
              type="button"
            />
            <MiniBtn
              text="저장"
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
