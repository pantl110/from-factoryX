"use client";

import Input from "@/ui/input";

const InputSection = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input label="회사명" required />
        <Input label="사업자등록번호" required />
      </div>
      <div className="flex gap-2">
        <Input label="대표자명" required />
        <Input label="납기일자" required />
      </div>
      <div className="flex gap-2">
        <Input label="회사주소" required />
      </div>
      <div className="flex gap-2">
        <Input label="납품주소" />
      </div>
      <div className="flex gap-2">
        <Input label="담당자명" required />
        <Input label="담당자 이메일" required />
      </div>
      <div className="flex gap-2">
        <Input label="담당자 연락처" />
        <Input label="담당자 팩스" />
      </div>
    </div>
  );
};

export default InputSection;
