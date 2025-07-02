import { CameraIcon } from "@phosphor-icons/react/dist/ssr";

import Input from "@/ui/input";
import MiniBtn from "@/ui/mini-btn";

const General = () => {
  return (
    <div className="px-10">
      <div className="w-full h-[1px] bg-[#eeeeee] mb-8" />
      <div className="flex flex-col gap-7">
        <h3 className="Heading-3">프로필 설정</h3>
        <div className="flex flex-col gap-7 border-b pb-8 border-b-[#eeeeee]">
          <div className="relative">
            <div className="flex items-center justify-center rounded-full w-[72px] h-[72px] bg-primary-8 border border-primary Me_Body-3 text-primary">
              JG
            </div>
            <div className="absolute top-11 left-11 flex items-center justify-center w-[33px] h-[33px] rounded-full border border-lg text-sv bg-white z-20">
              <CameraIcon size={16} weight="fill" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input placeholder="" label="이름" required />
              <Input placeholder="" label="시스템 권한" />
            </div>
            <div className="flex gap-2">
              <Input placeholder="" label="이메일" required />
              <Input placeholder="" label="연락처" />
            </div>
            <div className="flex gap-2">
              <Input placeholder="" label="소속부서/팀" />
              <Input placeholder="" label="직책" />
            </div>
          </div>
          <div>
            <MiniBtn
              text="저장하기"
              textColor="text-primary"
              bgColor="bg-primary-8"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col py-8 gap-7 border-b border-b-[#eeeeee]">
        <h3 className="Heading-3">회사정보</h3>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input placeholder="" label="회사명" required />
            <Input placeholder="" label="회사 연락처" />
          </div>
          <div className="flex gap-2">
            <Input placeholder="" label="대표자명" required />
            <Input placeholder="" label="대표자 연락처" required />
          </div>
          <div className="flex gap-2">
            <Input placeholder="" label="업종" />
            <Input placeholder="" label="종목" />
          </div>
          <div className="flex gap-2">
            <Input placeholder="" label="회사 주소" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6 py-8">
        <div className="flex flex-col gap-3">
          <h3 className="Heading-3">계정 삭제</h3>
          <p className="Me_Body-2 text-sv">
            계정 삭제는 되돌릴 수 없습니다. 삭제 후에는 모든 개인 정보 및 사용
            기록이 즉시 제거되며, 다시 복구할 수 없습니다. <br />
            계속하시겠습니까?
          </p>
        </div>
        <div>
          <MiniBtn text="계정 삭제" bgColor="bg-red" textColor="text-wh" />
        </div>
      </div>
    </div>
  );
};

export default General;
