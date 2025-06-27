"use client";

import Input from "@/ui/input";
import { useForm } from "@/hooks/use-form";

interface InputSectionProps {
  form: ReturnType<typeof useForm<any>>;
  isShowErrors: boolean;
}

const InputSection = ({ form, isShowErrors }: InputSectionProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input
          label="회사명"
          placeholder="회사명을 입력하세요."
          required
          value={form.formData.companyName}
          onChange={(v) => form.handleChange("companyName", v)}
          showError={isShowErrors && !form.formData.companyName}
        />
        <Input
          label="사업자등록번호"
          placeholder="사업자등록번호를 입력하세요."
          required
          value={form.formData.businessNumber}
          onChange={(v) => form.handleChange("businessNumber", v)}
          showError={isShowErrors && !form.formData.businessNumber}
          type="number"
        />
      </div>
      <div className="flex gap-2">
        <Input
          label="대표자명"
          placeholder="대표자명을 입력하세요."
          required
          value={form.formData.ceoName}
          onChange={(v) => form.handleChange("ceoName", v)}
          showError={isShowErrors && !form.formData.ceoName}
        />
        <Input
          label="납기일자"
          required
          value={form.formData.dueDate}
          onChange={(v) => form.handleChange("dueDate", v)}
          showError={isShowErrors && !form.formData.dueDate}
          type="date"
        />
      </div>
      <div className="flex gap-2">
        <Input
          label="회사주소"
          placeholder="회사주소를 입력하세요."
          required
          value={form.formData.companyAddress}
          onChange={(v) => form.handleChange("companyAddress", v)}
          showError={isShowErrors && !form.formData.companyAddress}
        />
      </div>
      <div className="flex gap-2">
        <Input
          label="납품주소"
          placeholder="납품주소를 입력하세요."
          value={form.formData.deliveryAddress}
          onChange={(v) => form.handleChange("deliveryAddress", v)}
        />
      </div>
      <div className="flex gap-2">
        <Input
          label="담당자명"
          placeholder="담당자명을 입력하세요."
          required
          value={form.formData.managerName}
          onChange={(v) => form.handleChange("managerName", v)}
          showError={isShowErrors && !form.formData.managerName}
        />
        <Input
          label="담당자 이메일"
          placeholder="담당자 이메일을 입력하세요."
          required
          value={form.formData.managerEmail}
          onChange={(v) => form.handleChange("managerEmail", v)}
          showError={isShowErrors && !form.formData.managerEmail}
        />
      </div>
      <div className="flex gap-2">
        <Input
          label="담당자 연락처"
          placeholder="담당자 연락처를 입력하세요."
          value={form.formData.managerPhone}
          onChange={(v) => form.handleChange("managerPhone", v)}
          type="number"
        />
        <Input
          label="담당자 팩스"
          placeholder="담당자 팩스를 입력하세요."
          value={form.formData.managerFax}
          onChange={(v) => form.handleChange("managerFax", v)}
          type="number"
        />
      </div>
    </div>
  );
};

export default InputSection;
