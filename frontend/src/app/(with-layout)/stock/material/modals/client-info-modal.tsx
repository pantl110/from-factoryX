import MiniBtn from "@/ui/mini-btn";
import Input from "@/ui/input";
import Modal from "@/ui/modal/modal";
import { ClientDataModel } from "@/types/data-model";
import { useDropdownFilter } from "@/hooks/use-dropdown-filter";
import { clientData } from "@/mocks/client-data";
import { ClientNameDropdown } from "@/ui/dropdown/client-name-dropdown";
import { useForm } from "react-hook-form";
import { InputMask } from "@react-input/mask";
import { forwardRef } from "react";

interface ClientInfoModalProps {
  onClose?: () => void;
  onNext?: () => void;
}

const BusinessNumberInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ showError, ...props }, ref) => (
  <Input
    label="사업자등록번호"
    placeholder="사업자등록번호 입력"
    required
    ref={ref}
    {...props}
    showError={showError}
  />
));
BusinessNumberInput.displayName = "BusinessNumberInput";

const ClientInfoModal = ({ onClose, onNext }: ClientInfoModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ClientDataModel>({
    mode: "onChange",
    defaultValues: {
      id: crypto.randomUUID(),
      type: "발주처",
      companyName: "",
      businessNumber: "",
      representativeName: "",
      businessType: "",
      businessCategory: "",
      contact: "",
      fax: "",
      email: "",
      companyAddress: "",
      dueDate: "",
      responsibleName: "",
    },
  });

  const {
    input: companyNameInput,
    setInput: setCompanyNameInput,
    isOpen: isCompanyNameDropdownOpen,
    setIsOpen: setIsCompanyNameDropdownOpen,
    filtered: filteredClients,
    handleSelect: handleCompanyNameSelect,
  } = useDropdownFilter(clientData, (item) => item.companyName);

  const handleSelectClient = (item: ClientDataModel) => {
    handleCompanyNameSelect(item);
    setCompanyNameInput(item.companyName);

    // 선택한 거래처 정보로 폼 자동 채우기
    setValue("companyName", item.companyName);
    setValue("businessNumber", item.businessNumber);
    setValue("representativeName", item.representativeName);
    setValue("companyAddress", item.companyAddress);
    setValue("email", item.email);
    setValue("contact", item.contact || "");
    setValue("fax", item.fax || "");
    setValue("businessType", item.businessType || "");
    setValue("businessCategory", item.businessCategory || "");

    setIsCompanyNameDropdownOpen(false);
  };

  return (
    <Modal
      title="거래처 정보를 입력해주세요."
      subtitle="등록된 정보는 이후 문서 작성 시 자동으로 불러와져요."
      onClose={onClose}
      width="w-[600px]"
    >
      <form
        className="flex flex-col gap-7 mt-4"
        onSubmit={handleSubmit(() => onNext && onNext())}
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-2.5">
            <div className="flex-1 relative">
              <Input
                label="거래처명"
                placeholder="거래처명 입력"
                required
                {...register("companyName", { required: true })}
                value={companyNameInput}
                onChange={(value: string) => {
                  setCompanyNameInput(value);
                  setValue("companyName", value);
                }}
                onFocus={() => setIsCompanyNameDropdownOpen(true)}
                onBlur={() =>
                  setTimeout(() => setIsCompanyNameDropdownOpen(false), 150)
                }
                showError={!!errors.companyName}
              />
              {isCompanyNameDropdownOpen && filteredClients.length > 0 && (
                <div className="absolute left-0 top-21 z-10 w-full">
                  <ClientNameDropdown
                    items={filteredClients}
                    onSelect={handleSelectClient}
                    width="w-full"
                  />
                </div>
              )}
            </div>
            <div className="flex-1">
              <InputMask
                component={BusinessNumberInput} // render → component 방식으로 변경
                mask="000-00-00000"
                replacement={{ 0: /[0-9]/ }}
                {...register("businessNumber", { required: true })}
                showError={!!errors.businessNumber}
              />
            </div>
          </div>
          <div className="flex gap-2.5">
            <Input
              label="대표자명"
              placeholder="대표자명 입력"
              required
              {...register("representativeName", {
                required: true,
              })}
              showError={!!errors.representativeName}
            />
            <Input
              label="담당자 이메일"
              placeholder="담당자 이메일 입력"
              {...register("email")}
            />
          </div>
          <div className="flex gap-2.5">
            <Input
              label="담당자 연락처"
              placeholder="담당자 연락처 입력"
              type="number"
              {...register("contact")}
            />
            <Input
              label="팩스 번호"
              placeholder="팩스 번호 입력"
              type="number"
              {...register("fax")}
            />
          </div>
          <div className="flex gap-2.5">
            <Input
              label="업태"
              placeholder="업태 입력"
              required
              {...register("businessType", {
                required: true,
              })}
              showError={!!errors.businessType}
            />
            <Input
              label="종목"
              placeholder="종목 입력"
              required
              {...register("businessCategory", {
                required: true,
              })}
              showError={!!errors.businessCategory}
            />
          </div>
          <div className="flex gap-2.5">
            <Input
              label="사업장 주소"
              placeholder="사업장 주소 입력"
              {...register("companyAddress")}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2.5">
          <MiniBtn
            text="취소하기"
            textColor="text-sv"
            onClick={onClose}
            hoverColor=""
          />
          <MiniBtn
            text="다음 단계"
            bgColor="bg-primary"
            textColor="text-wh"
            type="submit"
            hoverColor="hover:bg-primary-hover"
          />
        </div>
      </form>
    </Modal>
  );
};

export default ClientInfoModal;
