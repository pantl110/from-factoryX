import Checkbox from '@/ui/checkbox';
import { ClientResponseModel } from '@/types/data-model';
import Chip from '@/ui/chip';
import { ClientTypeColorMap } from '@/types/status-type';

interface ClientTableItemProps {
  client: ClientResponseModel;
  onClick?: () => void;
  isChecked?: boolean;
  onToggleCheck?: () => void;
}

const ClientTableItem = ({
  client,
  onClick,
  isChecked,
  onToggleCheck,
}: ClientTableItemProps) => {
  const clientTypeText = client.type === 'supplier' ? '발주처' : '수주처';
  const clientTypeColor =
    client.type === 'supplier'
      ? ClientTypeColorMap.supplier
      : ClientTypeColorMap.customer;

  return (
    <div
      className="flex h-14 items-center min-w-[1697px] border-b border-[#eeeeee] Me_Body-1 text-dg cursor-pointer hover:bg-bg transition-colors duration-200"
      onClick={onClick}
    >
      <Checkbox
        isChecked={isChecked || false}
        onToggle={onToggleCheck || (() => {})}
      />
      <div className="px-3 flex-[0.8]">
        <div>
          <Chip
            text={clientTypeText}
            bgColor={clientTypeColor.bgColor}
            textColor={clientTypeColor.textColor}
            radius="rounded-sm"
            cursor="cursor-pointer"
          />
        </div>
      </div>
      <p className="px-3 flex-[2] truncate" title={client.name || '-'}>
        {client.name || '-'}
      </p>
      <p className="px-3 flex-[1.5]">
        {client.business_registration_number || '-'}
      </p>
      <p
        className="px-3 flex-1 truncate"
        title={client.representative_name || '-'}
      >
        {client.representative_name || '-'}
      </p>
      <p
        className="px-3 flex-[1.5] truncate"
        title={client.business_type || '-'}
      >
        {client.business_type || '-'}
      </p>
      <p
        className="px-3 flex-[1.5] truncate"
        title={client.business_category || '-'}
      >
        {client.business_category || '-'}
      </p>
      <p className="px-3 flex-[1.5]">{client.phone || '-'}</p>
      <p className="px-3 flex-[2]">{client.email || '-'}</p>
    </div>
  );
};

export default ClientTableItem;
