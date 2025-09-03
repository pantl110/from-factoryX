import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import SearchInput from '@/ui/search-input';
import PriceInfoSection from './price-info-section';
import SelectedItem from './selected-item';

interface LinkTaxModalProps {
  onClose: () => void;
  supplyAmount: number;
}

const LinkReceiptModal = ({ onClose, supplyAmount }: LinkTaxModalProps) => {
  return (
    <Modal
      width="w-[1000px]"
      title="현금영수증에 구매 내역을 연결해주세요."
      subtitle="영수증에는 자재명이 따로 안 보여요. 자재를 직접 연결하면 추적과 단가를 정확히 관리할 수 있어요."
      onClose={onClose}
      scroll={true}
    >
      <div className="flex flex-col gap-4 mt-4 px-6">
        <PriceInfoSection supplyAmount={supplyAmount} />

        <div className="border-t border-lg" />

        <div
          className={`flex flex-col gap-2 overflow-y-auto pb-6 scrollbar-hide max-h-[calc(85vh-256.8px)]`}
        >
          <div className="flex gap-2.5">
            {/* 왼쪽 영역 */}
            <div className="flex-2 flex flex-col gap-3">
              <SearchInput
                placeholder="연결할 내역에 대한 원자재를 검색하세요."
                //   onChange={(value) => setSearchKeyword(value)}
              />
            </div>

            {/* 오른쪽 영역 */}
            <div className="flex-1 flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <p className="Heading-5 text-dg">3개 선택</p>
                <MiniBtn
                  text="전체 삭제"
                  hoverColor="hover:bg-bg"
                  textColor="text-dg"
                  borderColor="border-lg"
                />
              </div>
              <div className="bg-bg rounded-[8px] p-3 w-full flex flex-col gap-2">
                <SelectedItem /> <SelectedItem /> <SelectedItem />
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className={`flex gap-2.5 pt-2 justify-end`}>
            <MiniBtn
              text="취소"
              hoverColor="hover:bg-bg"
              textColor="text-sv"
              onClick={onClose}
            />
            <div className="flex gap-2.5">
              <MiniBtn
                text="내역 연결"
                hoverColor="hover:bg-primary-hover"
                bgColor="bg-primary"
                textColor="text-wh"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LinkReceiptModal;
