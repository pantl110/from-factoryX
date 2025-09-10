import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';

interface RefundPolicyModalProps {
  onClose: () => void;
}

const RefundPolicyModal = ({ onClose }: RefundPolicyModalProps) => {
  return (
    <Modal title="환불 및 구독정책" onClose={onClose} scroll={true}>
      <div className="flex flex-col gap-4 mt-4 px-6 max-h-[calc(85vh-80px)] overflow-y-auto scrollbar-hide">
        <div className="flex flex-col gap-2">
          <h4 className="Heading-4 text-dg">무료체험</h4>
          <ul className="list-disc list-inside">
            <li className="Re_Body-2 text-dg">
              최초 가입 시 1개월 무료 체험 제공
            </li>
            <li className="Re_Body-2 text-dg">
              무료 체험 기간 내 해지 시 과금되지 않음
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="Heading-4 text-dg">유료 구독 환불</h4>
          <ul className="list-disc list-inside">
            <li className="Re_Body-2 text-dg">
              유료 구독 결제 완료 후 환불은 불가
            </li>
            <li className="Re_Body-2 text-dg">
              단, 해지 요청 시 다음 결제일부터 과금 중단 처리
            </li>
            <li className="Re_Body-2 text-dg">
              중도 해지 시 사용하지 않은 잔여 기간에 대한 부분 환불은 제공하지
              않음
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="Heading-4 text-dg">부분 사용 환불 불가</h4>
          <ul className="list-disc list-inside">
            <li className="Re_Body-2 text-dg">
              월 단위로 제공되는 구독 상품 특성상, 사용 중도 해지 시 부분 환불
              불가
            </li>
            <li className="Re_Body-2 text-dg">
              결제일 기준으로 해당 월 말일까지 서비스 이용 가능
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="Heading-4 text-dg">특별 사유 환불</h4>
          <ul className="list-disc list-inside list-hanging">
            <li className="Re_Body-2 text-dg">
              서비스 장애, 운영사 사정 등 불가피한 일로 서비스 제공이 중단될
              경우 : 사용 기간을 고려하여 전액 또는 일부 환불 가능 체험 제공
            </li>
          </ul>
        </div>

        <div className="flex justify-end mb-4">
          <MiniBtn text="닫기" variant="primary" onClick={onClose} />
        </div>
      </div>
    </Modal>
  );
};

export default RefundPolicyModal;
