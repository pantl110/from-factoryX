import Chip from "@/ui/chip";
import ButtonSection from "./button-section";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import QuotationStatusDropdown from "./modals/quotation-status-dropdown";
import { usePortalDropdown } from "@/hooks/use-portal-dropdown";
import { useState } from "react";
import { UseFormTrigger } from "react-hook-form";
import { ClientDataModel } from "@/types/data-model";

interface TitleSecProps {
  setIsEmailOpen: (open: boolean) => void;
  setIsPrintOpen: (open: boolean) => void;
  setIsStartProductionModalOpen: (open: boolean) => void;
  isClientData: boolean;
  trigger: UseFormTrigger<ClientDataModel>;
}

const TitleSec = ({
  setIsEmailOpen,
  setIsPrintOpen,
  setIsStartProductionModalOpen,
  isClientData,
  trigger,
}: TitleSecProps) => {
  // 프로젝트 이름 상태
  const [projectName, setProjectName] = useState("플라스틱이 좋아");
  // 드랍다운 상태
  const {
    isOpen: isQuotationStatusDropdownOpen,
    openDropdown: openQuotationStatusDropdown,
    closeDropdown: closeQuotationStatusDropdown,
    anchorRect: quotationStatusAnchorRect,
  } = usePortalDropdown();

  return (
    <div className="flex gap-1 mb-4 pr-10">
      <div className="flex-1 gap-1 ">
        <div className="cursor-pointer relative">
          <Chip
            text="견적 협의"
            containerWidth="w-full"
            bgColor="bg-yellow-8"
            textColor="text-yellow"
            icon={<CaretDownIcon size={12} />}
            onClick={(e) => {
              if (e) openQuotationStatusDropdown(e);
            }}
          />
          {isQuotationStatusDropdownOpen && quotationStatusAnchorRect && (
            <div
              style={{
                position: "fixed",
                left: quotationStatusAnchorRect.left,
                top: quotationStatusAnchorRect.bottom,
                zIndex: 10,
              }}
            >
              <QuotationStatusDropdown onClose={closeQuotationStatusDropdown} />
            </div>
          )}
        </div>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="Heading-1 mt-2 outline-none placeholder:text-gr"
          placeholder="프로젝트명을 입력해주세요."
        />
      </div>
      <ButtonSection
        onEmailClick={() => setIsEmailOpen(true)}
        onPrintClick={() => setIsPrintOpen(true)}
        onStartProductionClick={async () => {
          const isValid = await trigger();
          if (isValid) {
            setIsStartProductionModalOpen(true);
          }
        }}
        isClientData={isClientData}
      />
    </div>
  );
};

export default TitleSec;
