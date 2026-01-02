import { useTranslations } from 'next-intl';
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
  const t = useTranslations('document.selectDropdown');
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
      <DropdownItem text={t('uploadQuotation')} onClick={handleUploadClick} />
      <DropdownItem text={t('uploadOrder')} onClick={handleGoToOrder} />
      <DropdownItem text={t('directInput')} onClick={handleGoToQuotation} />
    </Dropdown>
  );
};

export default SelectDropdown;
