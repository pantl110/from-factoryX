import { AccountsStatusType } from '@/types/status-type';
import { IconBtn, InfoLabelValue, MiniBtn, RoundChip } from '@/ui';
import React from 'react';
import { ArrowLineUpRight, CaretDown } from '@phosphor-icons/react';

const Project = () => {
  // TODO: 실제 데이터로 교체 필요
  const accountsStatus: AccountsStatusType = 'pending';
  const sendCount = 3; // TODO: 실제 데이터로 교체 필요

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between">
        <h3 className="Heading-3 h-10 flex items-center">연결된 프로젝트</h3>
        <MiniBtn text="프로젝트 바로가기" variant="whiteOutline" />
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
          <InfoLabelValue label="청구금액(합계)" value="15,000원" />
        </div>
        <div className="flex">
          <InfoLabelValue
            label="채권 상태"
            chip={{ status: accountsStatus }}
            value="0원"
          />
          <InfoLabelValue label="미수금액(잔액)" value="1,000원" />
        </div>
        <div className="flex">
          <InfoLabelValue
            label="결제조건"
            value={
              <div className="flex items-center justify-between w-full cursor-pointer">
                <span>매월 1일</span>
                <CaretDown size={18} className="text-gr" />
              </div>
            }
          />
          <InfoLabelValue
            label="청구서 발송 여부"
            value={
              <RoundChip
                text={`${sendCount}회 발송`}
                variant="sm"
                color="secondary"
              />
            }
          />
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

export default Project;
