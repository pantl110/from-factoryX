import { useState } from 'react';
import ClientTableHeader from './client-table-header';
import ClientTableItem from './client-table-item';
import ClientDetailPanel from './modals/client-detail-panel';
import { ClientListResponseModel } from '@/types/data-model';
import useFactoryStore from '@/store/factory-store';
import Pagination from '@/components/pagination';

interface ClientProps {
  clientList: ClientListResponseModel | null;
  onPageChange: (page: number) => void;
  isAllChecked: boolean;
  isChecked: (id: number) => boolean;
  toggleAll: () => void;
  toggleOne: (id: number) => void;
}

const Client = ({
  clientList,
  onPageChange,
  isAllChecked,
  isChecked,
  toggleAll,
  toggleOne,
}: ClientProps) => {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const factoryId = useFactoryStore((state) => state.factoryId);

  const actualClientList = clientList?.data || []; // 거래처 목록 // ResponseModel에서 data 추출
  const curPage = clientList?.curPage || 1; // 현재 페이지
  const pageCnt = clientList?.pageCnt || 1; // 총 페이지 수

  return (
    <>
      <div className="w-full mx-10 overflow-x-auto flex flex-col flex-1 max-w-[1697px] mb-10">
        <ClientTableHeader
          isAllChecked={isAllChecked}
          onToggleAll={toggleAll}
        />
        {actualClientList.map((client) => (
          <ClientTableItem
            key={client.id}
            client={client}
            onClick={() => setSelectedClientId(client.id)}
            isChecked={isChecked(client.id)}
            onToggleCheck={() => toggleOne(client.id)}
          />
        ))}
      </div>

      <Pagination
        currentPage={curPage}
        totalPages={pageCnt}
        onPageChange={onPageChange}
      />

      {/* panel */}
      {selectedClientId && factoryId && (
        <ClientDetailPanel
          onClose={() => setSelectedClientId(null)}
          clientId={selectedClientId}
          factoryId={factoryId}
        />
      )}
    </>
  );
};

export default Client;
