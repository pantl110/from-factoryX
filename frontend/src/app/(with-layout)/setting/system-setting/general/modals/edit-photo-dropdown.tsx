import Dropdown from '@/ui/dropdown/dropdown'
import DropdownItem from '@/ui/dropdown/dropdown-item'
import React from 'react'

interface EditPhotoDropdownProps {
  onClose: () => void
  onChangePhoto: () => void
  onDeletePhoto: () => void
}

const EditPhotoDropdown = ({ onClose, onChangePhoto, onDeletePhoto }: EditPhotoDropdownProps) => {
  return (
    <Dropdown onClose={onClose} width="w-[216px]" borderColor="border-lg">
      <DropdownItem onClick={onChangePhoto} text="프로필 사진 변경" />
      <DropdownItem onClick={onDeletePhoto} text="프로필 사진 삭제" />
    </Dropdown>
  )
}

export default EditPhotoDropdown
