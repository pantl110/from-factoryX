// import Chip from '@/ui/chip';
import Checkbox from '@/ui/checkbox';
import { ClientType, ClientTypeColorMap } from '@/types/status-type';
import { ClientResponseModel } from '@/types/data-model';
import Chip from '@/ui/chip';

interface ClientTableItemProps {
  client: ClientResponseModel;
  onClick?: () => void;
  onClientTypeChange?: (clientType: ClientType) => void;
  isChecked?: boolean;
  onToggleCheck?: () => void;
}

// 영어 타입을 한국어로 매핑하는 함수
const getClientTypeText = (clientType: ClientType): string => {
  const typeMap = {
    supplier: '발주처',
    customer: '수주처',
  };
  return typeMap[clientType] || clientType;
};

const ClientTableItem = ({
  client,
  onClick,
  isChecked,
  onToggleCheck,
}: ClientTableItemProps) => {
  const clientType = client.client_type;
  const clientTypeText = getClientTypeText(clientType);
  const clientTypeColor = ClientTypeColorMap[clientType];

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
