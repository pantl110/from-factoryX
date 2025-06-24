import { useState } from "react";
import { clientData, ClientDataModel } from "@/mocks/client-data";
import ClientTableHeader from "./client-table-header";
import ClientTableItem from "./client-table-item";
import Pagination from "@/components/pagination";
import ClientDetailPanel from "./modals/client-detail-panel";

const Client = () => {
  const [selectedClient, setSelectedClient] = useState<ClientDataModel | null>(
    null,
  );

  const handleItemClick = (client: ClientDataModel) => {
    setSelectedClient(client);
  };
  const handlePanelClose = () => {
    setSelectedClient(null);
  };

  return (
    <>
      <div className="w-full px-10 overflow-x-auto">
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
            onClick={() => handleItemClick(client)}
          />
        ))}
      </div>
      <Pagination />
      {selectedClient && (
        <ClientDetailPanel onClose={handlePanelClose} client={selectedClient} />
      )}
    </>
  );
};

export default Client;
