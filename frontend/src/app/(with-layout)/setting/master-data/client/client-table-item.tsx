import Chip from "@/ui/chip";
import { ClientType, ClientTypeColorMap } from "./types";
import ClientTypeDropdown from "./modals/client-type-dropdown";
import { usePortalDropdown } from "@/hooks/use-portal-dropdown";
import { createPortal } from "react-dom";

interface ClientTableItemProps {
  clientType: ClientType;
  companyName: string;
  businessNumber: string;
  representativeName: string;
  businessType: string;
  businessCategory: string;
  contact: string;
  email: string;
  onClick?: () => void;
  onClientTypeChange?: (clientType: ClientType) => void;
  isDeleteMode: boolean;
}

const PortalDropdown = ({
  anchorRect,
  onClose,
  children,
}: {
  anchorRect: DOMRect | null;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  if (!anchorRect) return null;
  const style: React.CSSProperties = {
    position: "absolute",
    top: anchorRect.bottom + 8,
    left: anchorRect.left,
    zIndex: 50,
  };
  return createPortal(<div style={style}>{children}</div>, document.body);
};

const ClientTableItem = ({
  clientType,
  companyName,
  businessNumber,
  representativeName,
  businessType,
  businessCategory,
  contact,
  email,
  onClick,
  onClientTypeChange,
  isDeleteMode,
}: ClientTableItemProps) => {
  const clientTypeColor = ClientTypeColorMap[clientType];
  const { isOpen, openDropdown, closeDropdown, anchorRect } =
    usePortalDropdown();

  const handleClientTypeSelect = (newClientType: ClientType) => {
    onClientTypeChange?.(newClientType);
    closeDropdown();
  };

  return (
    <div
      className="flex h-14 items-center w-[1697px] border-b border-[#eeeeee] Me_Body-1 text-dg cursor-pointer"
      onClick={onClick}
    >
      {isDeleteMode && (
        <div
          className="flex items-center px-3"
          onClick={(e) => e.stopPropagation()}
        >
          <input type="checkbox" className="w-4 h-4 border-sv" />
        </div>
      )}
      <div className="px-3 w-[150px]" onClick={(e) => e.stopPropagation()}>
        <div>
          <Chip
            text={clientType}
            bgColor={clientTypeColor.bgColor}
            textColor={clientTypeColor.textColor}
            radius="rounded-sm"
            cursor="cursor-pointer"
            onClick={(e) => {
              if (e) openDropdown(e);
            }}
          />
        </div>
      </div>
      <p className="px-3 flex-1">{companyName}</p>
      <p className="px-3 flex-1">{businessNumber}</p>
      <p className="px-3 w-[100px]">{representativeName}</p>
      <p className="px-3 w-[200px]">{businessType}</p>
      <p className="px-3 flex-1">{businessCategory}</p>
      <p className="px-3 w-[150px]">{contact}</p>
      <p className="px-3 flex-1">{email}</p>

      {/* client type dropdown */}
      {isOpen && anchorRect && (
        <PortalDropdown anchorRect={anchorRect} onClose={closeDropdown}>
          <ClientTypeDropdown
            onClose={closeDropdown}
            onSelect={handleClientTypeSelect}
            currentClientType={clientType}
          />
        </PortalDropdown>
      )}
    </div>
  );
};

export default ClientTableItem;
