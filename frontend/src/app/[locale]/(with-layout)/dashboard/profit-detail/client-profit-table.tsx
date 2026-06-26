'use client';

import { useTranslations } from 'next-intl';
import { ClientProfitModel, ProfitListScopeType } from '@/types/data-model';
import {
  ProfitValueHeaderCells,
  SortableHeaderCell,
} from './profit-table-cells';
import ClientProfitTableItem from './client-profit-table-item';
import ProfitListTable from './profit-list-table';

interface ClientProfitTableProps {
  scope: ProfitListScopeType;
  from: string;
  to: string;
  parentId?: string;
  onSelect?: (client: ClientProfitModel) => void;
  searchable?: boolean;
  title?: string;
}

const ClientProfitTable = ({
  scope,
  from,
  to,
  parentId,
  onSelect,
  searchable,
  title,
}: ClientProfitTableProps) => {
  const t = useTranslations('dashboard.profitDetail');

  return (
    <ProfitListTable<ClientProfitModel>
      scope={scope}
      from={from}
      to={to}
      parentId={parentId}
      defaultSort="profit"
      searchable={searchable}
      title={title}
      searchPlaceholder={t('searchClientPlaceholder')}
      noResultText={t('noClientResult')}
      noDataText={t('noClientData')}
      renderHeader={(sort) => (
        <>
          <SortableHeaderCell
            label={t('colClient')}
            columnKey="client_name"
            widthClass="flex-1"
            sort={sort}
          />
          <ProfitValueHeaderCells sort={sort} />
        </>
      )}
      renderRows={(rows) =>
        rows.map((row) => (
          <ClientProfitTableItem
            key={row.client_id}
            client={row}
            onSelect={onSelect}
          />
        ))
      }
    />
  );
};

export default ClientProfitTable;
