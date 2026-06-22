import useGetClientDetail from '@/hooks/factory/factory-client/use-get-client-detail';
import { useUpdateClient } from '@/hooks';
import { ClientUpdateModel } from '@/types/data-model';
import Panel from '@/ui/panel';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import MiniBtn from '@/ui/mini-btn';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { ClientInfo } from './client-info';
import { AccountInfo } from './account-info';
import { DepositorInfo } from './depositor-info';
import { useTranslations } from 'next-intl';
// 임시 주석처리: 자료실 섹션
// import ClientDocuments, { ClientDocumentItemModel } from './client-documents';

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
  const factoryId = useMemberStore((state) => state.factoryId);
  const { clientDetail, isLoading } = useGetClientDetail(clientId, factoryId);
  const { updateClient, isLoading: isUpdateLoading } = useUpdateClient();

  // 임시 주석처리: 자료실 섹션
  // const [clientDocuments, setClientDocuments] = useState<
  //   ClientDocumentItemModel[]
  // >([]);

  const tCommon = useTranslations('common');
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
      bank_name: '',
      account_number: '',
      account_holder: '',
      depositor_name: '',
    },
  });

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
        bank_name: clientDetail.bank_name || '',
        account_number: clientDetail.account_number || '',
        account_holder: clientDetail.account_holder || '',
        depositor_name: clientDetail.depositor_name || '',
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

  // 임시 주석처리: 자료실 섹션
  // const handleClientFilesSelected = (files: File[]) => {
  //   if (!files.length) return;
  //
  //   const now = new Date();
  //   const newItems: ClientDocumentItemModel[] = files.map((file, index) => ({
  //     id: `${now.getTime()}-${file.name}-${index}`,
  //     name: file.name,
  //     size: file.size,
  //     mimeType: file.type,
  //     uploadedAt: now.toISOString(),
  //     uploaderName: undefined,
  //   }));
  //
  //   // 최신 업로드가 위로 오도록 prepend
  //   setClientDocuments((prev) => [...newItems, ...prev]);
  // };

  return (
    <Panel
      title={tCommon('client')}
      onClose={onClose}
      headerButton={
        (!clientDetail || isDirty) &&
        !isLoading && (
          <MiniBtn variant="secondary"
            text={tCommon('save')}
            disabled={!isDirty || !isValid || isUpdateLoading}
            onClick={handleSubmit(onSubmit)}
          />
        )
      }
    >
      {isLoading ? null : (
        <div className="flex flex-col gap-10">
          <ClientInfo
            control={control}
            isViewer={isViewer}
            hasSubscription={hasSubscription}
            clientDetail={clientDetail}
          />

          {clientDetail?.is_customer && (
            <DepositorInfo
              control={control}
              isViewer={isViewer}
              hasSubscription={hasSubscription}
            />
          )}

          {clientDetail?.is_supplier && (
            <AccountInfo
              control={control}
              isViewer={isViewer}
              hasSubscription={hasSubscription}
            />
          )}

          {/* 임시 주석처리: 자료실 섹션
          <ClientDocuments
            documents={clientDocuments}
            isLoading={false}
            isViewer={isViewer}
            hasSubscription={hasSubscription}
            onFilesSelected={handleClientFilesSelected}
          />
          */}
        </div>
      )}
    </Panel>
  );
};

export default ClientDetailPanel;
