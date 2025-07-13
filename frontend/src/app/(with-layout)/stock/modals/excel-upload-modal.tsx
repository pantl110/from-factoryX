import Modal from '@/ui/modal/modal'
import DropzoneArea from '@/ui/dropzone-area'
import { useState } from 'react'

interface ExcelUploadModalProps {
  onClose: () => void
  type?: 'product' | 'material'
}

const ExcelUploadModal = ({ onClose, type = 'product' }: ExcelUploadModalProps) => {
  const [hasFiles, setHasFiles] = useState(false)

  const handleComplete = () => {
    onClose()
  }

  const onFileUpload = (hasFiles: boolean) => {
    setHasFiles(hasFiles)
  }

  const getTitle = () => {
    if (hasFiles) {
      return '업로드된 파일을 확인해 주세요.'
    }
    return type === 'product'
      ? '엑셀 파일을 업로드하여 재고를 등록해주세요.'
      : '엑셀 파일로 자재 목록을 한번에 등록하세요.'
  }

  const getSubtitle = () => {
    if (hasFiles) {
      return '파일이 맞는지 확인 후, 업로드를 눌러주세요.'
    }
    return type === 'product'
      ? '샘플 파일 양식에 맞춰 작성한 후 업로드해 주세요.'
      : '샘플 파일 양식에 맞춰 작성한 후 업로드해 주세요.'
  }

  return (
    <Modal title={getTitle()} subtitle={getSubtitle()} onClose={onClose} width="w-[600px]">
      <div className="mt-3">
        <DropzoneArea
          onClose={onClose}
          onComplete={handleComplete}
          onFileUpload={onFileUpload}
          accept={{
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/excel': ['.xls', '.xlsx'],
          }}
        />
      </div>
    </Modal>
  )
}

export default ExcelUploadModal
