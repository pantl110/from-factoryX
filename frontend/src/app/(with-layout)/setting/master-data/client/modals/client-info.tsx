import { Controller, Control } from 'react-hook-form';
import {
  formatBusinessNumber,
  formatFaxNumber,
  formatPhoneNumber,
} from '@/hooks';
import { ClientUpdateModel, ClientResponseModel } from '@/types/data-model';
import InfoLabelValue from '@/ui/info-label-value';
import { RoundChip } from '@/ui/round-chip';

interface ClientInfoProps {
  control: Control<ClientUpdateModel>;
  isViewer: boolean;
  hasSubscription: () => boolean;
  clientDetail: ClientResponseModel | null;
}

export const ClientInfo = ({
  control,
  isViewer,
  hasSubscription,
  clientDetail,
}: ClientInfoProps) => {
  return (
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
                label="회사명"
                isEditing={!isViewer && hasSubscription()}
                placeholder="(필수) 회사명을 입력하세요."
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
                isEditing={!isViewer && hasSubscription()}
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
                isEditing={!isViewer && hasSubscription()}
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
                isEditing={!isViewer && hasSubscription()}
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
                isEditing={!isViewer && hasSubscription()}
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
                isEditing={!isViewer && hasSubscription()}
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
                isEditing={!isViewer && hasSubscription()}
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
                isEditing={!isViewer && hasSubscription()}
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
                isEditing={!isViewer && hasSubscription()}
                placeholder="(필수) 사업장 주소를 입력하세요."
                required
                {...field}
              />
            )}
          />
        </div>
        <div className="flex">
          <InfoLabelValue
            label="거래처 구분"
            value={
              <div className="flex gap-1">
                {clientDetail?.is_customer === true && (
                  <RoundChip text="수주처" variant="sm" color="secondary" />
                )}
                {clientDetail?.is_supplier === true && (
                  <RoundChip text="발주처" variant="sm" color="red" />
                )}
                {clientDetail?.is_supplier === false &&
                  clientDetail?.is_customer === false &&
                  '-'}
              </div>
            }
          />
        </div>
        <div className="flex border-b border-lg w-full">
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="비고"
                isEditing={!isViewer && hasSubscription()}
                placeholder="-"
                textarea={true}
                {...field}
              />
            )}
          />
        </div>
      </div>
    </form>
  );
};
