import MiniBtn from "@/ui/mini-btn";
import Input from "@/ui/input";
import Modal from "@/ui/modal/modal";
import { useForm } from "@/hooks/use-form";
import { ClientDataModel } from "@/types/data-model";
import { useDropdownFilter } from "@/hooks/use-dropdown-filter";
import { clientData } from "@/mocks/client-data";
import { ClientNameDropdown } from "@/ui/dropdown/client-name-dropdown";

interface ClientInfoModalProps {
  onClose?: () => void;
  onNext?: () => void;
}

const ClientInfoModal = ({ onClose, onNext }: ClientInfoModalProps) => {
  const { formData, isShowErrors, handleChange, handleSubmit } =
    useForm<ClientDataModel>({
      initialData: {
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
      validationRules: {
        companyName: (v) => !!(v || "").trim(),
        businessNumber: (v) => !!(v || "").trim(),
        representativeName: (v) => !!(v || "").trim(),
        businessType: (v) => !!(v || "").trim(),
        businessCategory: (v) => !!(v || "").trim(),
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
    handleChange("companyName", item.companyName);
    handleChange("businessNumber", item.businessNumber);
    handleChange("representativeName", item.representativeName);
    handleChange("companyAddress", item.companyAddress);
    handleChange("email", item.email);
    handleChange("contact", item.contact || "");
    handleChange("fax", item.fax || "");
    handleChange("businessType", item.businessType || "");
    handleChange("businessCategory", item.businessCategory || "");

    setIsCompanyNameDropdownOpen(false);
  };

  return (
    <Modal
      title="거래처 정보를 입력해주세요."
      subtitle="등록된 정보는 이후 문서 작성 시 자동으로 불러와져요."
      onClose={onClose}
      width="w-[600px]"
    >
      <div className="flex flex-col gap-7 mt-4">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2.5">
            <div className="flex-1 relative">
              <Input
                label="거래처명"
                placeholder="거래처명 입력"
                required
                value={companyNameInput}
                onChange={setCompanyNameInput}
                onFocus={() => setIsCompanyNameDropdownOpen(true)}
                onBlur={() =>
                  setTimeout(() => setIsCompanyNameDropdownOpen(false), 150)
                }
                showError={isShowErrors && !(formData.companyName || "").trim()}
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
              <Input
                label="사업자등록번호"
                placeholder="사업자등록번호 입력"
                type="number"
                required
                value={formData.businessNumber}
                onChange={(v: string) => handleChange("businessNumber", v)}
                showError={
                  isShowErrors && !(formData.businessNumber || "").trim()
                }
              />
            </div>
          </div>
          <div className="flex gap-2.5">
            <Input
              label="대표자명"
              placeholder="대표자명 입력"
              required
              value={formData.representativeName}
              onChange={(v: string) => handleChange("representativeName", v)}
              showError={
                isShowErrors && !(formData.representativeName || "").trim()
              }
            />
            <Input
              label="담당자 이메일"
              placeholder="담당자 이메일 입력"
              value={formData.email}
              onChange={(v: string) => handleChange("email", v)}
            />
          </div>
          <div className="flex gap-2.5">
            <Input
              label="담당자 연락처"
              placeholder="담당자 연락처 입력"
              type="number"
              value={formData.contact}
              onChange={(v: string) => handleChange("contact", v)}
            />
            <Input
              label="팩스 번호"
              placeholder="팩스 번호 입력"
              type="number"
              value={formData.fax}
              onChange={(v: string) => handleChange("fax", v)}
            />
          </div>
          <div className="flex gap-2.5">
            <Input
              label="업태"
              placeholder="업태 입력"
              required
              value={formData.businessType}
              onChange={(v: string) => handleChange("businessType", v)}
              showError={isShowErrors && !(formData.businessType || "").trim()}
            />
            <Input
              label="종목"
              placeholder="종목 입력"
              required
              value={formData.businessCategory}
              onChange={(v: string) => handleChange("businessCategory", v)}
              showError={
                isShowErrors && !(formData.businessCategory || "").trim()
              }
            />
          </div>
          <div className="flex gap-2.5">
            <Input
              label="사업장 주소"
              placeholder="사업장 주소 입력"
              value={formData.companyAddress}
              onChange={(v: string) => handleChange("companyAddress", v)}
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
            onClick={() => handleSubmit(() => onNext && onNext())}
            hoverColor="hover:bg-primary-hover"
          />
        </div>
      </div>
    </Modal>
  );
};

export default ClientInfoModal;
