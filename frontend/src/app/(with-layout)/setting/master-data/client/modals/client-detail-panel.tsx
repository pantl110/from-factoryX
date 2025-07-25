import {
  formatBusinessNumber,
  formatFaxNumber,
  formatPhoneNumber,
} from '@/hooks';
import useGetClientDetail from '@/hooks/factory/factory-client/use-get-client-detail';
import { useUpdateClient } from '@/hooks';
import { ClientUpdateModel } from '@/types/data-model';
import InfoLabelValue from '@/ui/info-label-value';
import Panel from '@/ui/panel';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import MiniBtn from '@/ui/mini-btn';

interface ClientDetailPanelProps {
  clientId: number;
  factoryId: number;
  onClose: () => void;
  refetchClient: () => void;
}

const ClientDetailPanel = ({
  clientId,
  factoryId,
  onClose,
  refetchClient,
}: ClientDetailPanelProps) => {
  const { getClientDetail, clientDetail } = useGetClientDetail();
  const { updateClient, isLoading: isUpdateLoading } = useUpdateClient();

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
      // client_type: 'customer',
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
    if (clientDetail) {
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
        // client_type: clientDetail.client_type as ClientType,
        note: clientDetail.note || '',
      });
    }
  }, [clientDetail, reset, clientId, factoryId]);

  const onSubmit = async (data: ClientUpdateModel) => {
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
      <form className="flex flex-col gap-3">
        <h3 className="Heading-3">거래처 정보</h3>

        <div>
          <div className="flex">
            <Controller
              name="name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <InfoLabelValue
                  label="거래처명"
                  isEditing={true}
                  placeholder="(필수) 거래처명을 입력하세요."
                  required
                  {...field}
                />
              )}
            />
            <Controller
              name="business_registration_number"
              control={control}
              rules={{
                required: true,
                pattern: /^\d{3}-\d{2}-\d{5}$/,
              }}
              render={({ field }) => (
                <InfoLabelValue
                  label="사업자등록번호"
                  isEditing={true}
                  placeholder="(필수) 사업자등록번호를 입력하세요."
                  required
                  value={field.value}
                  onChange={(e) => {
                    const formatted = formatBusinessNumber(e.target.value);
                    field.onChange(formatted);
                  }}
                  onBlur={() => field.onBlur()}
                />
              )}
            />
          </div>
          <div className="flex">
            <Controller
              name="representative_name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <InfoLabelValue
                  label="대표자명"
                  isEditing={true}
                  placeholder="(필수) 대표자명을 입력하세요."
                  required
                  {...field}
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              rules={{
                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              }}
              render={({ field }) => (
                <InfoLabelValue
                  label="이메일"
                  isEditing={true}
                  placeholder="-"
                  {...field}
                />
              )}
            />
          </div>
          <div className="flex">
            <Controller
              name="phone"
              control={control}
              rules={{
                pattern: /^(01[016789]-\d{3,4}-\d{4}|0\d{1,2}-\d{3,4}-\d{4})$/,
              }}
              render={({ field }) => (
                <InfoLabelValue
                  label="연락처"
                  isEditing={true}
                  placeholder="-"
                  value={field.value}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    field.onChange(formatted);
                  }}
                  onBlur={() => field.onBlur()}
                />
              )}
            />
            <Controller
              name="fax"
              control={control}
              rules={{ pattern: /^(0\d{1,3}-\d{3,4}-\d{4})$/ }}
              render={({ field }) => (
                <InfoLabelValue
                  label="팩스 번호"
                  isEditing={true}
                  placeholder="-"
                  value={field.value}
                  onChange={(e) => {
                    const formatted = formatFaxNumber(e.target.value);
                    field.onChange(formatted);
                  }}
                  onBlur={() => field.onBlur()}
                />
              )}
            />
          </div>
          <div className="flex">
            <Controller
              name="business_type"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <InfoLabelValue
                  label="업태"
                  isEditing={true}
                  placeholder="(필수) 업태를 입력하세요."
                  required
                  {...field}
                />
              )}
            />
            <Controller
              name="business_category"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <InfoLabelValue
                  label="종목"
                  isEditing={true}
                  placeholder="(필수) 종목을 입력하세요."
                  required
                  {...field}
                />
              )}
            />
          </div>
          <div className="flex">
            <Controller
              name="address"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <InfoLabelValue
                  label="사업장 주소"
                  isEditing={true}
                  placeholder="(필수) 사업장 주소를 입력하세요."
                  required
                  {...field}
                />
              )}
            />
          </div>
          {/* <div className="flex">
            <InfoLabelValue
              label="거래처"
              // value={
              //   <Chip
              //     text={getClientTypeText(clientType)}
              //     bgColor={clientTypeColor.bgColor}
              //     textColor={clientTypeColor.textColor}
              //   />
              // }
            />
          </div> */}
          <div className="flex border-b border-lg w-full">
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <InfoLabelValue
                  label="비고"
                  isEditing={true}
                  placeholder="-"
                  textarea={true}
                  {...field}
                />
              )}
            />
          </div>
        </div>
      </form>
    </Panel>
  );
};

export default ClientDetailPanel;
