import { useState } from "react";
import { clientData } from "@/mocks/client-data";
import ClientTableHeader from "./client-table-header";
import ClientTableItem from "./client-table-item";
import ClientDetailPanel from "./modals/client-detail-panel";
import { ClientDataModel } from "@/types/data-model";

interface ClientProps {
  isAllChecked: boolean;
  isChecked: (id: string) => boolean;
  toggleAll: () => void;
  toggleOne: (id: string) => void;
}

const Client = ({
  isAllChecked,
  isChecked,
  toggleAll,
  toggleOne,
}: ClientProps) => {
  const [selectedClient, setSelectedClient] = useState<ClientDataModel | null>(
    null,
  );

  const handleTypeChange = (client: ClientDataModel) => {
    setSelectedClient(client);
  };

  return (
    <>
      <div className="w-full mx-10 overflow-x-auto flex flex-col flex-1 max-w-[1320px]">
        <ClientTableHeader
          isAllChecked={isAllChecked}
          onToggleAll={toggleAll}
        />
        {clientData.map((client) => (
          <ClientTableItem
            key={client.id}
            clientType={client.type}
            companyName={client.companyName}
            businessNumber={client.businessNumber}
            representativeName={client.representativeName}
            businessType={client.businessType ?? ""}
            businessCategory={client.businessCategory ?? ""}
            contact={client.contact ?? ""}
            email={client.email ?? ""}
            onClick={() => handleTypeChange(client)}
            isChecked={isChecked(client.id)}
            onToggleCheck={() => toggleOne(client.id)}
          />
        ))}
      </div>

      {/* panel */}
      {selectedClient && (
        <ClientDetailPanel
          onClose={() => {
            setSelectedClient(null);
          }}
          client={selectedClient}
        />
      )}
    </>
  );
};

export default Client;
