import Chip from '@/ui/chip';
import Checkbox from '@/ui/checkbox';
import { ClientType, ClientTypeColorMap } from '@/types/status-type';
import { ClientResponseModel } from '@/types/data-model';

interface ClientTableItemProps {
  client: ClientResponseModel;
  onClick?: () => void;
  onClientTypeChange?: (clientType: ClientType) => void;
  isChecked?: boolean;
  onToggleCheck?: () => void;
}

const ClientTableItem = ({
  client,
  onClick,
  isChecked,
  onToggleCheck,
}: ClientTableItemProps) => {
  // 기본값으로 '발주처' 사용 (API에서 type 필드가 없음) // 추후 수정하기
  const clientType: ClientType = '발주처';
  const clientTypeColor =
    ClientTypeColorMap[clientType as keyof typeof ClientTypeColorMap];

  return (
    <div
      className="flex h-14 items-center w-[1697px] border-b border-[#eeeeee] Me_Body-1 text-dg cursor-pointer hover:bg-bg transition-colors duration-200"
      onClick={onClick}
    >
      <Checkbox
        isChecked={isChecked || false}
        onToggle={onToggleCheck || (() => {})}
      />
      <div className="px-3 flex-[0.8]">
        <div>
          <Chip
            text={clientType}
            bgColor={clientTypeColor.bgColor}
            textColor={clientTypeColor.textColor}
            radius="rounded-sm"
            cursor="cursor-pointer"
          />
        </div>
      </div>
      <p className="px-3 flex-[2]">{client.name}</p>
      <p className="px-3 flex-[1.5]">
        {client.business_registration_number || ''}
      </p>
      <p className="px-3 flex-1">{client.representative_name || ''}</p>
      <p className="px-3 flex-[1.5]">{client.business_type || ''}</p>
      <p className="px-3 flex-[1.5]">{client.business_category || ''}</p>
      <p className="px-3 flex-[1.5]">{client.phone || ''}</p>
      <p className="px-3 flex-[2]">{client.email || ''}</p>

      {/* client type dropdown */}
      {/* {isOpen && anchorRect && (
        <PortalDropdown anchorRect={anchorRect} onClose={closeDropdown}>
          <ClientTypeDropdown
            onClose={closeDropdown}
            onSelect={handleClientTypeSelect}
            currentClientType={clientType}
          />
        </PortalDropdown>
      )} */}
    </div>
  );
};

export default ClientTableItem;
