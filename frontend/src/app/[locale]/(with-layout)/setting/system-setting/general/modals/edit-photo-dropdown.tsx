import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import React from 'react';
import { useTranslations } from 'next-intl';

interface EditPhotoDropdownProps {
  onClose: () => void;
  onChangePhoto: () => void;
  onDeletePhoto: () => void;
}

const EditPhotoDropdown = ({
  onClose,
  onChangePhoto,
  onDeletePhoto,
}: EditPhotoDropdownProps) => {
  const tEditPhoto = useTranslations('setting.systemSetting.general.editPhoto');

  return (
    <Dropdown onClose={onClose} width="w-[216px]" borderColor="border-lg">
      <DropdownItem onClick={onChangePhoto} text={tEditPhoto('changePhoto')} />
      <DropdownItem onClick={onDeletePhoto} text={tEditPhoto('deletePhoto')} />
    </Dropdown>
  );
};

export default EditPhotoDropdown;
