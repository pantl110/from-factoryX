'use client';

import { useTranslations } from 'next-intl';
import Chip from '@/ui/chip';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { createPortal } from 'react-dom';

interface DeliveryStateDropdownProps {
  onClose: () => void;
  onPendingClick: () => void;
  onCompletedClick: () => void;
  anchorRect?: DOMRect | null;
}

const DeliveryStateDropdown = ({
  onClose,
  onPendingClick,
  onCompletedClick,
  anchorRect,
}: DeliveryStateDropdownProps) => {
  const tDelivery = useTranslations('production.delivery.status');

  if (!anchorRect) return null;

  const dropdownContent = (
    <Dropdown onClose={onClose} width="w-fit" padding="p-4" gap="gap-3">
      <DropdownItem
        onClick={(e) => {
          e?.stopPropagation();
          onClose();
        }}
        noHover={true}
        chip={true}
      >
        <Chip
          text={tDelivery('pending')}
          bgColor="bg-bg"
          textColor="text-dg"
          hover="hover:bg-lg"
          onClick={onPendingClick}
          cursor="cursor-pointer"
        />
      </DropdownItem>
      <DropdownItem
        onClick={(e) => {
          e?.stopPropagation();
          onClose();
        }}
        noHover={true}
        chip={true}
      >
        <Chip
          text={tDelivery('completed')}
          bgColor="bg-green-8"
          textColor="text-primary"
          hover="hover:bg-secondary-hover"
          onClick={onCompletedClick}
          cursor="cursor-pointer"
        />
      </DropdownItem>
    </Dropdown>
  );

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: anchorRect.bottom + window.scrollY + 8,
        left: anchorRect.left + window.scrollX,
        zIndex: 1000,
      }}
    >
      {dropdownContent}
    </div>,
    document.body
  );
};

export default DeliveryStateDropdown;
