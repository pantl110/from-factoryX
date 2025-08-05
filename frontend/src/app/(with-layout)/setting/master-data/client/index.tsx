import { useState } from 'react';
import ClientTableHeader from './client-table-header';
import ClientTableItem from './client-table-item';
import ClientDetailPanel from './modals/client-detail-panel';
import { ClientListResponseModel } from '@/types/data-model';
import Pagination from '@/components/pagination';

// 로컬스토리지에서 factoryId를 안전하게 가져오는 함수
const getStoredFactoryId = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('factoryId');
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
};

interface ClientProps {
  clientList: ClientListResponseModel | null;
  onPageChange: (page: number) => void;
  isAllChecked: boolean;
  isChecked: (id: number) => boolean;
  toggleAll: () => void;
  toggleOne: (id: number) => void;
  refetchClient: () => void;
}

const Client = ({
  clientList,
  onPageChange,
  isAllChecked,
  isChecked,
  toggleAll,
  toggleOne,
  refetchClient,
}: ClientProps) => {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  return (
    <>
      <div className="w-full px-10 mb-10">
        <div className="w-full overflow-x-auto flex flex-col flex-1">
          <ClientTableHeader
            isAllChecked={isAllChecked}
            onToggleAll={toggleAll}
          />
          {(clientList?.data || []).map((client) => (
            <ClientTableItem
              key={client.id}
              client={client}
              onClick={() => setSelectedClientId(client.id)}
              isChecked={isChecked(client.id)}
              onToggleCheck={() => toggleOne(client.id)}
            />
          ))}
        </div>
        {(clientList?.pageCnt || 1) > 1 && (
          <Pagination
            currentPage={clientList?.curPage || 1}
            totalPages={clientList?.pageCnt || 1}
            onPageChange={onPageChange}
          />
        )}
      </div>

      {/* panel */}
      {selectedClientId && getStoredFactoryId() && (
        <ClientDetailPanel
          onClose={() => setSelectedClientId(null)}
          refetchClient={refetchClient}
          clientId={selectedClientId}
        />
      )}
    </>
  );
};

export default Client;
