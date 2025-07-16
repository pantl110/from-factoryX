import { useState } from 'react'
import ClientTableHeader from './client-table-header'
import ClientTableItem from './client-table-item'
import ClientDetailPanel from './modals/client-detail-panel'
import { ClientResponseModel, ClientListResponseModel } from '@/types/data-model'
import useFactoryStore from '@/store/factory-store'
import Pagination from '@/components/pagination'

interface ClientProps {
  isAllChecked: boolean
  isChecked: (id: number) => boolean
  toggleAll: () => void
  toggleOne: (id: number) => void
}

const Client = ({
  isAllChecked,
  isChecked,
  toggleAll,
  toggleOne,
}: ClientProps) => {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const factoryId = useFactoryStore((state) => state.factoryId)

  // (목록 데이터 없음)
  const actualClientList: ClientResponseModel[] = []

  return (
    <>
      <div className="w-full mx-10 overflow-x-auto flex flex-col flex-1 max-w-[1697px] mb-10">
        <ClientTableHeader isAllChecked={isAllChecked} onToggleAll={toggleAll} />
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

      {/* <Pagination
        currentPage={curPage}
        totalPages={pageCnt}
        onPageChange={onPageChange || (() => { })}
      /> */}

      {/* panel */}
      {selectedClientId && factoryId && (
        <ClientDetailPanel
          onClose={() => setSelectedClientId(null)}
          clientId={selectedClientId}
          factoryId={factoryId}
        />
      )}
    </>
  )
}

export default Client
