import React from 'react';
import NoHistoryBox from '@/ui/no-history-box';
import {
  UseFieldArrayRemove,
  UseFormSetValue,
  Control,
  FieldArrayWithId,
} from 'react-hook-form';
import LocationItem from '../../location-item';

interface LocationFormModel {
  locations: {
    id?: number;
    location: string;
    images: (string | File)[];
  }[];
}

interface StockLocationProps {
  control: Control<LocationFormModel>;
  fields: FieldArrayWithId<LocationFormModel, 'locations', 'id'>[];
  remove: UseFieldArrayRemove;
  setValue: UseFormSetValue<LocationFormModel>;
  // openUploadModal: (index: number) => void;
  watch: (name: string) => (string | File)[] | undefined;
}

const StockLocation = ({ fields, watch }: StockLocationProps) => {
  if (!fields || fields.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <NoHistoryBox
          title="등록된 창고 위치가 아직 없어요."
          text="[추가] 버튼을 눌러 원자재가 보관된 창고를 등록해보세요."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="p-5 rounded-[8px] border border-lg flex flex-col gap-3">
        {fields.map((field, index) => {
          const watchedImages = watch(`locations.${index}.images`);
          const images =
            (Array.isArray(watchedImages) ? watchedImages : null) ||
            (Array.isArray(field.images) ? field.images : null) ||
            [];
          const location = field.location || '';
          const firstImage =
            images.length > 0
              ? typeof images[0] === 'string'
                ? images[0]
                : URL.createObjectURL(images[0])
              : '';

          return (
            <React.Fragment key={field.id || index}>
              <LocationItem
                image={firstImage}
                length={images.length}
                location={location}
              />
              {index < fields.length - 1 && (
                <div className="h-[1px] bg-lg w-full" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StockLocation;
