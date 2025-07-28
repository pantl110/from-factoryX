import StockLocationItem from './stock-location-item';
import NoHistoryBox from '@/ui/no-history-box';
import {
  UseFieldArrayRemove,
  UseFormSetValue,
  Control,
  FieldArrayWithId,
} from 'react-hook-form';

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
  openUploadModal: (index: number) => void;
  watch: (name: string) => (string | File)[] | undefined;
}

const StockLocation = ({
  control,
  fields,
  remove,
  setValue,
  openUploadModal,
  watch,
}: StockLocationProps) => {
  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 ? (
        <NoHistoryBox
          title="등록된 창고 위치가 아직 없어요."
          text="[추가] 버튼을 눌러 원자재가 보관된 창고를 등록해보세요."
        />
      ) : (
        fields.map((field, index) => (
          <StockLocationItem
            key={field.id}
            index={index}
            control={control}
            remove={remove}
            openUploadModal={() => openUploadModal(index)}
            images={watch(`locations.${index}.images`) || []}
            setValue={setValue}
          />
        ))
      )}
    </div>
  );
};

export default StockLocation;
