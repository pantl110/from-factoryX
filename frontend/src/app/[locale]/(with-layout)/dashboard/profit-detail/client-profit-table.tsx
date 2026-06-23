'use client';

import { useTranslations } from 'next-intl';
import { ClientProfitModel } from '@/types/data-model';
import { ProfitValueHeaderCells } from './profit-table-cells';
import ClientProfitTableItem from './client-profit-table-item';

interface ClientProfitTableProps {
  rows: ClientProfitModel[];
  onSelect: (client: ClientProfitModel) => void;
}

const ClientProfitTable = ({ rows, onSelect }: ClientProfitTableProps) => {
  const t = useTranslations('dashboard.profitDetail');

  return (
    <div>
      <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 text-sv rounded-sm cursor-default">
        <p className="px-3 flex-1">{t('colClient')}</p>
        <ProfitValueHeaderCells />
      </div>
      {rows.map((row) => (
        <ClientProfitTableItem
          key={row.client_id}
          client={row}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export default ClientProfitTable;
