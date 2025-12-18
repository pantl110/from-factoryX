import { ProjectResponseModel } from '@/types/data-model';
import { RoundChip } from '@/ui/round-chip';
import { getProjectStatusColor } from '@/utils';
import { getProductNamesDisplay } from '@/utils/get-product-names-display';
import { getStartDate } from '@/utils';

interface LinkProjectTableItemProps {
  onItemClick: () => void;
  isSelected: boolean;
  item: ProjectResponseModel;
}

const LinkProjectTableItem = ({
  onItemClick,
  isSelected,
  item,
}: LinkProjectTableItemProps) => {
  const getDisplayText = (status: string): string => {
    const displayMap: Record<string, string> = {
      quotation: '견적 요청',
      confirmed: '주문 확정',
      pending: '생산 대기',
      production: '생산 중',
      manufactured: '생산 완료',
      delivery: '납품',
      completed: '완료',
      suspended: '중단',
    };
    return displayMap[status] || '견적 요청';
  };

  const displayText = getDisplayText(item.status);
  const chipColor = getProjectStatusColor(item.status);

  const clientName =
    item.status === 'quotation' ||
    item.status === 'confirmed' ||
    item.status === 'suspended'
      ? item.client_name || '-'
      : item.quotations[0]?.client_info?.name || '-';

  const productNames =
    item.status === 'quotation' ||
    item.status === 'confirmed' ||
    item.status === 'suspended'
      ? item.quotations[0]?.products
          ?.map((product) => product?.product?.name)
          .filter((name) => name?.trim()) || []
      : item.quotations &&
          item.quotations.length > 0 &&
          item.quotations[0]?.products_info
        ? item.quotations[0].products_info
            .map((product) => product?.name)
            .filter((name) => name?.trim()) || []
        : [];

  const productsName = getProductNamesDisplay(productNames);

  return (
    <div
      className={`flex items-center h-14 w-full text-bl Me_Body-1 transition-colors duration-200 cursor-pointer ${
        isSelected
          ? 'border border-primary bg-secondary'
          : 'border-b border-lg hover:bg-bg'
      }`}
      onClick={onItemClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onItemClick();
      }}
    >
      <div className="flex-[0.6] pl-2 pr-4">
        <RoundChip
          text={displayText}
          color={chipColor}
          variant="defaultSmall"
        />
      </div>
      <p className="flex-1 px-3 text-dg truncate" title={clientName}>
        {clientName}
      </p>
      <p className="flex-1 px-3 text-dg truncate" title={productsName}>
        {productsName}
      </p>
      <p className="flex-[0.8] px-3 text-dg">{getStartDate(item)}</p>
    </div>
  );
};

export default LinkProjectTableItem;
