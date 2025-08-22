import { useState } from 'react';
import ClientTableHeader from './client-table-header';
import ClientTableItem from './client-table-item';
import ClientDetailPanel from './modals/client-detail-panel';
import { ClientListResponseModel } from '@/types/data-model';
import Pagination from '@/components/pagination';
import useFactoryStore from '@/store/factory-store';
import NoHistoryBox from '@/ui/no-history-box';

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
  const factoryId = useFactoryStore((state) => state.factoryId);

  return (
    <>
      <div className="w-full px-10 mb-10">
        {!factoryId || clientList?.data.length === 0 ? (
          <NoHistoryBox
            title="거래처정보가 아직 없어요."
            text="거래처 정보를 생성하면 이곳에 표시돼요."
          />
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* panel */}
      {selectedClientId && factoryId && (
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
