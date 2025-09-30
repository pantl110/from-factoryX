import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import { Plus, X } from '@phosphor-icons/react';
import { Controller, Control, UseFormSetValue } from 'react-hook-form';
import Image from 'next/image';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

interface LocationFormModel {
  locations: {
    id?: number;
    location: string;
    images: (string | File)[];
  }[];
}

interface StockLocationItemProps {
  index: number;
  control: Control<LocationFormModel>;
  remove: (index: number) => void;
  openUploadModal: () => void;
  images: (string | File)[];
  setValue: UseFormSetValue<LocationFormModel>;
}

const StockLocationItem = ({
  index,
  control,
  remove,
  openUploadModal,
  images = [],
  setValue,
}: StockLocationItemProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const handleRemoveImage = (removeIdx: number) => {
    const newImages = images.filter((_, i) => i !== removeIdx);
    setValue(`locations.${index}.images`, newImages, { shouldDirty: true });
  };

  return (
    <div className="p-4 flex flex-col gap-4 rounded-[8px] border border-lg ">
      <Controller
        control={control}
        name={`locations.${index}.location`}
        render={({ field }) => (
          <Input
            {...field}
            placeholder="품목이 있는 창고 위치를 입력하세요."
            label="창고 위치"
            disabledReadOnly={isViewer || !hasSubscription()}
          />
        )}
      />
      <div className="flex justify-between items-end">
        <div className="flex gap-2.5">
          {images?.map((img, i) => (
            <div key={i} className="relative group">
              <Image
                src={typeof img === 'string' ? img : URL.createObjectURL(img)}
                width={80}
                height={80}
                className="w-20 h-20 object-cover rounded-[8px] border border-lg"
                alt="미리보기"
                quality={100}
                unoptimized={true}
              />
              {!isViewer && hasSubscription() && (
                <div className="rounded-bl-[8px] rounded-tr-[8px] bg-bg opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out absolute top-0 right-0 cursor-pointer w-8 h-8 flex items-center justify-center">
                  <X
                    size={16}
                    className="text-sv"
                    onClick={() => handleRemoveImage(i)}
                  />
                </div>
              )}
            </div>
          ))}
          {images?.length < 9 && !isViewer && hasSubscription() && (
            <div
              className="w-20 h-20 bg-primary-8 flex items-center justify-center rounded-[8px] cursor-pointer"
              onClick={openUploadModal}
            >
              <Plus size={24} className="text-primary" />
            </div>
          )}
        </div>

        {!isViewer && hasSubscription() && (
          <MiniBtn
            text="삭제"
            textColor="text-red"
            bgColor="bg-red-8"
            hoverColor="hover:bg-red-hover"
            onClick={() => remove(index)}
          />
        )}
      </div>
    </div>
  );
};

export default StockLocationItem;
