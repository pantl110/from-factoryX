import Checkbox from '@/ui/checkbox';
import { ClientResponseModel } from '@/types/data-model';
import { RoundChip } from '@/ui/round-chip';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

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
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <div
      className="flex h-14 items-center min-w-[1697px] border-b border-[#eeeeee] Me_Body-1 text-dg cursor-pointer hover:bg-bg transition-colors duration-200"
      onClick={onClick}
    >
      {!isViewer && hasSubscription() && (
        <Checkbox
          isChecked={isChecked || false}
          onToggle={onToggleCheck || (() => {})}
        />
      )}
      <div className="px-3 flex-[1.2]">
        <div className="flex gap-1">
          {client.is_customer === true && (
            <RoundChip text="수주처" variant="sm" color="secondary" />
          )}
          {client.is_supplier === true && (
            <RoundChip text="발주처" variant="sm" color="red" />
          )}

          {client.is_supplier === false && client.is_customer === false && '-'}
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
