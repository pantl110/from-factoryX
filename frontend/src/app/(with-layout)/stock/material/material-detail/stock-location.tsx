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
    email?: string;
    role?: string;
    memo?: string;
    created_at?: string;
    updated_at?: string;
  }[];
}

interface StockLocationProps {
  control: Control<LocationFormModel>;
  fields: FieldArrayWithId<LocationFormModel, 'locations', 'id'>[];
  remove: UseFieldArrayRemove;
  setValue: UseFormSetValue<LocationFormModel>;
  // openUploadModal: (index: number) => void;
  watch: (name: string) => (string | File)[] | undefined;
  onLocationClick?: (locationId: number) => void;
  locations?: LocationFormModel['locations'];
}

const StockLocation = ({
  fields,
  watch,
  onLocationClick,
  locations,
  remove,
}: StockLocationProps) => {
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
      <div className="px-4 py-3 rounded-[8px] border border-lg flex flex-col gap-3">
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
                email={locations?.[index]?.email}
                role={locations?.[index]?.role}
                memo={locations?.[index]?.memo}
                createdAt={locations?.[index]?.created_at}
                updatedAt={locations?.[index]?.updated_at}
                onClick={() => {
                  // field 객체에서 실제 location id를 가져옴 (watch로 현재 값을 확인)
                  const locationData = watch(`locations.${index}`) as
                    | { id?: number }
                    | undefined;
                  const locationId =
                    locationData?.id || (field.id as number | undefined);
                  if (typeof locationId === 'number' && onLocationClick) {
                    onLocationClick(locationId);
                  }
                }}
                onDelete={() => remove(index)}
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
