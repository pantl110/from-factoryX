import { OcrDataModel } from '@/types/data-model';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import { useRouter } from 'next/navigation';

interface SelectDropdownProps {
  onClose: () => void;
  onUploadClick: () => void;
  onDirectInputClick: (ocrData?: OcrDataModel) => void;
  onOrderUploadClick: () => void;
}

const SelectDropdown = ({
  onClose,
  onUploadClick,
  onDirectInputClick,
  onOrderUploadClick,
}: SelectDropdownProps) => {
  const router = useRouter();

  const handleGoToQuotation = () => {
    onDirectInputClick(); // 빈 값으로 설정
    router.push('/quotation');
  };

  const handleUploadClick = () => {
    onUploadClick(); // upload-modal 열기만 하고, clientData 는 upload-modal에서 처리
  };

  const handleGoToOrder = () => {
    onOrderUploadClick();
  };

  return (
    <Dropdown onClose={onClose}>
      <DropdownItem text="견적요청서 업로드" onClick={handleUploadClick} />
      <DropdownItem text="주문서 업로드" onClick={handleGoToOrder} />
      <DropdownItem text="직접 입력" onClick={handleGoToQuotation} />
    </Dropdown>
  );
};

export default SelectDropdown;
