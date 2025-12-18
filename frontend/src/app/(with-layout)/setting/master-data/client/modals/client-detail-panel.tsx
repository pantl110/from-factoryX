import useGetClientDetail from '@/hooks/factory/factory-client/use-get-client-detail';
import { useUpdateClient } from '@/hooks';
import { ClientUpdateModel } from '@/types/data-model';
import Panel from '@/ui/panel';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import MiniBtn from '@/ui/mini-btn';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { ClientInfo } from './client-info';
import { AccountInfo } from './account-info';

interface ClientDetailPanelProps {
  clientId: number;
  onClose: () => void;
  refetchClient: () => void;
}

const ClientDetailPanel = ({
  clientId,
  onClose,
  refetchClient,
}: ClientDetailPanelProps) => {
  const { getClientDetail, clientDetail } = useGetClientDetail();
  const { updateClient, isLoading: isUpdateLoading } = useUpdateClient();

  const factoryId = useMemberStore((state) => state.factoryId);
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const {
    handleSubmit,
    reset,
    control,
    formState: { isDirty, isValid },
  } = useForm<ClientUpdateModel>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      business_registration_number: '',
      representative_name: '',
      email: '',
      phone: '',
      fax: '',
      business_type: '',
      business_category: '',
      address: '',
      is_customer: false,
      is_supplier: false,
      note: '',
    },
  });

  useEffect(() => {
    if (clientId && factoryId) {
      getClientDetail({ client_id: clientId, factory_id: factoryId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, factoryId]);

  // clientDetail이 로드되면 폼에 기본값 설정
  useEffect(() => {
    if (clientDetail && factoryId) {
      reset({
        client_id: clientId,
        factory_id: factoryId,
        name: clientDetail.name || '',
        business_registration_number:
          clientDetail.business_registration_number || '',
        representative_name: clientDetail.representative_name || '',
        email: clientDetail.email || '',
        phone: clientDetail.phone || '',
        fax: clientDetail.fax || '',
        business_type: clientDetail.business_type || '',
        business_category: clientDetail.business_category || '',
        address: clientDetail.address || '',
        is_customer: clientDetail.is_customer || false,
        is_supplier: clientDetail.is_supplier || false,
        note: clientDetail.note || '',
      });
    }
  }, [clientDetail, reset, clientId, factoryId]);

  const onSubmit = async (data: ClientUpdateModel) => {
    if (!factoryId) return;

    try {
      const result = await updateClient({
        ...data,
        client_id: clientId,
        factory_id: factoryId,
      });

      if (result.success) {
        refetchClient();
        onClose();
      }
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  return (
    <Panel
      title="거래처"
      onClose={onClose}
      headerButton={
        (!clientDetail || isDirty) && (
          <MiniBtn
            text="저장"
            textColor="text-primary"
            bgColor="bg-primary-8"
            hoverColor="hover:bg-secondary-hover"
            disabled={!isDirty || !isValid || isUpdateLoading}
            onClick={handleSubmit(onSubmit)}
          />
        )
      }
    >
      <ClientInfo
        control={control}
        isViewer={isViewer}
        hasSubscription={hasSubscription}
        clientDetail={clientDetail}
      />
      <AccountInfo />
    </Panel>
  );
};

export default ClientDetailPanel;
