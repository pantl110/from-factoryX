import { AccountsStatusType } from '@/types/status-type';
import { IconBtn, InfoLabelValue, MiniBtn, RoundChip } from '@/ui';
import React, { useState } from 'react';
import { ArrowLineUpRight, CaretDown } from '@phosphor-icons/react';
import TermDropdown from './term-dropdown';
import { TermType, TERM_LABEL_MAP } from './types';

interface InfoProps {
  handleOpenTaxDetail: () => void;
  isPurchase: boolean;
  projectId?: number | null;
  onOpenLinkProjectModal: () => void;
}

const Info = ({
  handleOpenTaxDetail,
  isPurchase,
  projectId,
  onOpenLinkProjectModal,
}: InfoProps) => {
  const accountsStatus: AccountsStatusType = 'pending';
  const sendCount = 3; // TODO: 실제 데이터로 교체 필요

  const title = isPurchase ? '매입채무 정보' : '매출채권 정보';
  const statusLabel = isPurchase ? '채무 상태' : '채권 상태';
  const remainLabel = isPurchase ? '미지급금(잔액)' : '미수금액(잔액)';

  const handleProjectClick = () => {
    if (projectId) {
      window.open(`/production/${projectId}`, '_blank');
    } else {
      onOpenLinkProjectModal();
    }
  };

  const [isTermOpen, setIsTermOpen] = useState(false);
  const [termType, setTermType] = useState<TermType>('INVOICE_30');
  const [customTerm, setCustomTerm] = useState('');

  const isCustom = termType === 'CUSTOM';
  const displayTerm = isCustom ? customTerm : TERM_LABEL_MAP[termType];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between">
        <h3 className="Heading-3 h-10 flex items-center">{title}</h3>
        <div className="flex gap-2">
          <MiniBtn
            text="세금계산서 상세보기"
            variant="whiteOutline"
            onClick={handleOpenTaxDetail}
          />
          <MiniBtn
            text={projectId ? '프로젝트 바로가기' : '프로젝트 연결하기'}
            variant="whiteOutline"
            onClick={handleProjectClick}
          />
        </div>
      </div>

      {/* 표 */}
      <div>
        <div className="flex">
          <InfoLabelValue
            label="업체명"
            value={
              <div className="flex items-center gap-2 w-full cursor-pointer">
                <span>플라스틱이 좋아</span>
                <IconBtn
                  icon={ArrowLineUpRight}
                  size="w-7 h-7"
                  iconSize={18}
                  onClick={() => {}}
                />
              </div>
            }
          />
          <InfoLabelValue label="입금자명" value="홍길동" />
        </div>
        <div className="flex">
          <InfoLabelValue label="청구금액(합계)" value="15,000원" />
          <InfoLabelValue label={remainLabel} value="1,000원" />
        </div>

        <div className="flex">
          <div className="relative flex-1">
            <InfoLabelValue
              label="수금 조건"
              value={
                <div
                  className="flex items-center justify-between w-full cursor-pointer"
                  onClick={() => setIsTermOpen((prev) => !prev)}
                >
                  {isCustom ? (
                    <input
                      className="flex-1 bg-transparent outline-none"
                      placeholder="직접 입력"
                      value={customTerm}
                      onChange={(e) => setCustomTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate">{displayTerm}</span>
                  )}
                  <CaretDown size={18} className="text-gr" />
                </div>
              }
            />
            {isTermOpen && (
              <div className="absolute right-0 top-full mt-2 z-10">
                <TermDropdown
                  onClose={() => setIsTermOpen(false)}
                  onSelect={(type) => {
                    setIsTermOpen(false);
                    if (type === 'CUSTOM') {
                      setTermType('CUSTOM');
                      setCustomTerm('');
                    } else {
                      setTermType(type);
                    }
                  }}
                />
              </div>
            )}
          </div>
          <div className="flex-1">
            <InfoLabelValue
              label="약정 입금일"
              value={
                <div className="flex items-center gap-2 w-full">
                  <RoundChip text="D-20" variant="sm" color="secondary" />
                  <span>2025-12-17</span>
                </div>
              }
            />
          </div>
        </div>

        <div className="flex">
          <InfoLabelValue
            label={statusLabel}
            chip={{ status: accountsStatus }}
            value={isPurchase ? undefined : '0원'}
          />
          {!isPurchase && (
            <InfoLabelValue
              label="청구서 발송"
              value={
                <RoundChip
                  text={`${sendCount}회 발송`}
                  variant="sm"
                  color="secondary"
                />
              }
            />
          )}
        </div>

        <InfoLabelValue
          label="특이사항"
          placeholder="특이사항을 입력하세요."
          value=""
        />
      </div>
    </div>
  );
};

export default Info;
