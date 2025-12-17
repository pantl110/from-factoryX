import { IconBtn, RoundChip } from '@/ui';
import { ArrowLineUpRight, PencilSimple } from '@phosphor-icons/react';

const AccountInfo = () => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 flex items-center">입금 정보</h3>
      <div className="w-full grid grid-cols-2 gap-3 p-5 rounded-[8px] border border-lg">
        <div className="flex items-center gap-2">
          <p className="w-30 Me_Body-1 text-sv">업체명</p>
          <div className="flex items-center gap-2">
            <p className="Me_Body-2 text-dg truncate" title="플라스틱이 좋아">
              플라스틱이 좋아
            </p>
            <IconBtn
              icon={ArrowLineUpRight}
              size="w-7 h-7"
              iconSize={18}
              onClick={() => {}}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="w-30 Me_Body-1 text-sv">청구금액(합계)</p>
          <div className="flex items-center gap-2">
            <p className="Me_Body-2 text-dg truncate" title="15,000원">
              15,000원
            </p>
          </div>
        </div>

        {/* 두 번째 행 */}
        <div className="flex items-center gap-2">
          <p className="w-30 Me_Body-1 text-sv">계좌 번호</p>
          <div className="flex items-center gap-2">
            <p className="Me_Body-2 text-dg truncate">우리은행</p>
            <p className="Me_Body-2 text-dg truncate">SYYY-CZZ-ZZZZZZ</p>
            <IconBtn
              icon={PencilSimple}
              size="w-7 h-7"
              iconSize={18}
              onClick={() => {}}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="w-30 Me_Body-1 text-sv">예금주</p>
          <div className="flex items-center gap-2">
            <p className="Me_Body-2 text-dg truncate">홍길동</p>
            <IconBtn
              icon={PencilSimple}
              size="w-7 h-7"
              iconSize={18}
              onClick={() => {}}
            />
          </div>
        </div>

        {/* 세 번째 행 */}
        <div className="flex items-center gap-2">
          <p className="w-30 Me_Body-1 text-sv">약정 입금일</p>
          <div className="flex items-center gap-2">
            <p className="Me_Body-2 text-dg truncate">2025-12-17</p>
            <IconBtn
              icon={PencilSimple}
              size="w-7 h-7"
              iconSize={18}
              onClick={() => {}}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="w-30 Me_Body-1 text-sv">일수</p>
          <RoundChip text="연체 D-20" variant="sm" color="red" />
        </div>
      </div>
    </div>
  );
};

export default AccountInfo;
