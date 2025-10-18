import DropzoneArea from '@/ui/dropzone-area';
import Input from '@/ui/input';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import { X } from '@phosphor-icons/react';

interface StockLocationModalProps {
  mode: 'add' | 'update';
  onClose: () => void;
}

const StockLocationModal = ({ mode, onClose }: StockLocationModalProps) => {
  return (
    <Modal
      onClose={onClose}
      title={mode === 'add' ? '창고 위치 추가' : '창고 위치 수정'}
      width="w-[800px]"
    >
      <div className="flex flex-col gap-3 mt-4">
        <Input
          label="창고 위치명"
          required
          placeholder="창고 위치를 입력하세요."
        />
        <Input label="상세 위치" placeholder="상세 위치를 입력하세요." />
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-1 h-5">
            <label htmlFor="memo" className="Me_Body-1 text-dg">
              메모
            </label>
          </div>
          <textarea
            name="memo"
            placeholder="메모를 입력하세요."
            id="memo"
            rows={4}
          ></textarea>
        </div>

        {/* 창고 사진 */}
        <div className="flex flex-col gap-2 w-full">
          <label htmlFor="warehouse-photos" className="Me_Body-1 text-dg">
            창고 사진
          </label>

          <DropzoneArea
            variant="location"
            fileCount={10}
            onClose={onClose}
            accept={{
              'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
            }}
            // onFileUpload={onFileUpload}
            // onComplete={handleUpload}
          />

          <div className="flex gap-2.5">
            <div className="relative">
              <div className="w-20 h-20 bg-lg rounded-[8px] border border-lg" />
              <button
                className="rounded-full bg-wh absolute -top-[5px] -right-[8px] w-5 h-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] flex items-center justify-center"
                onClick={() => {}}
              >
                <X size={14} className="text-sv" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2.5 mt-5">
        <MiniBtn text="취소" variant="white" onClick={onClose} />
        <MiniBtn text="저장" variant="primary" onClick={onClose} />
      </div>
    </Modal>
  );
};

export default StockLocationModal;
