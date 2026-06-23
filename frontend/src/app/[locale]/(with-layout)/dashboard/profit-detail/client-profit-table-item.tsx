'use client';

import { useState } from 'react';
import { ClientProfitModel } from '@/types/data-model';
import ClientSettingPanel from '@/app/[locale]/(with-layout)/setting/master-data/client/modals/client-detail-panel';
import { NameShortcutCell, ProfitValueCells } from './profit-table-cells';

interface ClientProfitTableItemProps {
  client: ClientProfitModel;
  onSelect?: (client: ClientProfitModel) => void;
}

const ClientProfitTableItem = ({
  client,
  onSelect,
}: ClientProfitTableItemProps) => {
  const [isClientPanelOpen, setIsClientPanelOpen] = useState(false);

  return (
    <>
      <div
        onClick={onSelect ? () => onSelect(client) : undefined}
        className={`h-14 flex items-center Me_Body-3 text-dg border-b border-lg ${
          onSelect
            ? 'cursor-pointer hover:bg-bg transition-colors ease-in-out duration-200'
            : 'cursor-default'
        }`}
      >
        <NameShortcutCell
          name={client.client_name}
          isEstimated={client.is_estimated}
          onShortcut={(e) => {
            e?.stopPropagation();
            setIsClientPanelOpen(true);
          }}
        />
        <ProfitValueCells {...client} />
      </div>

      {isClientPanelOpen && (
        <ClientSettingPanel
          clientId={client.client_id}
          onClose={() => setIsClientPanelOpen(false)}
          refetchClient={() => {}}
        />
      )}
    </>
  );
};

export default ClientProfitTableItem;
