import Chip from '@/ui/chip';
import {
  DeliveryStatusColorMap,
  DeliveryStatusType,
  ProjectStatusType,
} from '@/types/status-type';
import {
  QuotationProductResponseModel,
  ProductResponseModel,
} from '@/types/data-model';
import Checkbox from '@/ui/checkbox';
import { usePortalDropdown } from '@/hooks/use-portal-dropdown';
import DeliveryStateDropdown from './modals/delivery-state-dropdown';

interface DeliveryTableItemProps {
  data: QuotationProductResponseModel;
  productDetail: ProductResponseModel | null;
  isChecked: boolean;
  onToggle: () => void;
  onItemClick: (
    data: QuotationProductResponseModel,
    productDetail: ProductResponseModel | null
  ) => void;
  projectStatus: ProjectStatusType;
}

const DeliveryTableItem = ({
  data,
  productDetail,
  isChecked,
  onToggle,
  onItemClick,
  projectStatus,
}: DeliveryTableItemProps) => {
  const deliveryStatus = data.is_delivery ? '완료' : '예정';
  const colors = DeliveryStatusColorMap[deliveryStatus as DeliveryStatusType];
  const { isOpen, openDropdown, closeDropdown, anchorRect } =
    usePortalDropdown();
  return (
    <>
      <div className="flex items-center h-14 min-w-[1305px] rounded border-b border-lg">
        <Checkbox isChecked={isChecked} onToggle={onToggle} />
        <div className="w-[150px] flex items-center py-3 px-2">
          <Chip
            text={deliveryStatus}
            bgColor={colors.bgColor}
            textColor={colors.textColor}
            state={projectStatus === 'delivery' ? true : false}
            onClick={
              projectStatus === 'delivery'
                ? (e) => e && openDropdown(e)
                : undefined
            }
          />
        </div>
        <div
          className="flex-2 px-3 flex justify-between cursor-pointer group"
          onClick={() => onItemClick(data, productDetail)}
        >
          <p className=" text-dg Me_Body-1">{productDetail?.name || '-'}</p>
          <p className="R_Body-1 text-gr opacity-0 group-hover:opacity-100 transition-opacity duration-200 ">
            납품표 보기
          </p>
        </div>
        <p className="flex-1 px-3 text-dg Me_Body-1">
          {productDetail?.code || '-'}
        </p>
        <p className="flex-1 px-3 text-dg Me_Body-1">
          {productDetail?.spec || '-'}
        </p>
        <p className="w-[80px] px-3 text-dg Me_Body-1">
          {productDetail?.unit || '-'}
        </p>
        <p className="flex-1 px-3 text-dg Me_Body-1">
          {data.quantity.toLocaleString()}
        </p>
        <p className="flex-1 px-3 text-dg Me_Body-1">
          {data.delivery_date || '-'}
        </p>
      </div>
      {isOpen && anchorRect && (
        <DeliveryStateDropdown
          onClose={closeDropdown}
          onPendingClick={() => {}}
          onCompletedClick={() => {}}
          anchorRect={anchorRect}
        />
      )}
    </>
  );
};

export default DeliveryTableItem;
