import { useState } from "react";
import { clientData, ClientDataModel } from "@/mocks/client-data";
import ClientTableHeader from "./client-table-header";
import ClientTableItem from "./client-table-item";
import ClientDetailPanel from "./modals/client-detail-panel";

const Client = () => {
  const [selectedClient, setSelectedClient] = useState<ClientDataModel | null>(
    null,
  );

  const handleTypeChange = (client: ClientDataModel) => {
    setSelectedClient(client);
  };

  return (
    <>
      <div className="w-full px-10 overflow-x-auto flex flex-col flex-1">
        <ClientTableHeader />
        {clientData.map((client) => (
          <ClientTableItem
            key={client.id}
            clientType={client.type}
            companyName={client.companyName}
            businessNumber={client.businessNumber}
            representativeName={client.representativeName}
            businessType={client.businessType}
            businessCategory={client.businessCategory}
            contact={client.contact}
            email={client.email}
            onClick={() => handleTypeChange(client)}
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
