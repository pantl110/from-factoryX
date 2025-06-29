"use client";

import Input from "@/ui/input";
import { useForm } from "@/hooks/use-form";
import { ClientDataModel } from "@/types/data-model";
import {
  extractNumbers,
  formatBusinessNumber,
  formatPhoneNumber,
  formatFaxNumber,
  handleNumberKeyDown,
} from "@/hooks/format-number";
// import InputDatepicker from "@/ui/input-datepicker";

interface InputSectionProps {
  form: ReturnType<typeof useForm<ClientDataModel>>;
  isShowErrors: boolean;
}

const InputSection = ({ form, isShowErrors }: InputSectionProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input
          label="거래처명"
          placeholder="거래처명을 입력하세요."
          required
          value={form.formData.companyName}
          onChange={(v) => form.handleChange("companyName", v)}
          showError={isShowErrors && !form.formData.companyName}
        />
        <Input
          label="사업자등록번호"
          placeholder="사업자등록번호를 입력하세요."
          required
          value={formatBusinessNumber(form.formData.businessNumber)}
          onChange={(v) => {
            const numbers = extractNumbers(v);
            form.handleChange("businessNumber", numbers);
          }}
          onKeyDown={handleNumberKeyDown}
          showError={isShowErrors && !form.formData.businessNumber}
        />
      </div>
      <div className="flex gap-2">
        <Input
          label="대표자명"
          placeholder="대표자명을 입력하세요."
          required
          value={form.formData.representativeName}
          onChange={(v) => form.handleChange("representativeName", v)}
          showError={isShowErrors && !form.formData.representativeName}
        />
        <Input
          label="납기일자"
          required
          value={form.formData.dueDate}
          onChange={(v) => form.handleChange("dueDate", v)}
          showError={isShowErrors && !form.formData.dueDate}
          type="date"
        />
        {/* <InputDatepicker
          label="납기일자"
          required
          value={form.formData.dueDate}
          onChange={(v) => form.handleChange("dueDate", v)}
          showError={isShowErrors && !form.formData.dueDate}
        /> */}
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
          value={form.formData.representativeName}
          onChange={(v) => form.handleChange("representativeName", v)}
          showError={isShowErrors && !form.formData.representativeName}
        />
        <Input
          label="담당자 이메일"
          placeholder="담당자 이메일을 입력하세요."
          required
          value={form.formData.email}
          onChange={(v) => form.handleChange("email", v)}
          showError={isShowErrors && !form.formData.email}
        />
      </div>
      <div className="flex gap-2">
        <Input
          label="담당자 연락처"
          placeholder="담당자 연락처를 입력하세요."
          value={formatPhoneNumber(form.formData.contact || "")}
          onChange={(v) => {
            const numbers = extractNumbers(v);
            form.handleChange("contact", numbers);
          }}
          onKeyDown={handleNumberKeyDown}
        />
        <Input
          label="담당자 팩스"
          placeholder="담당자 팩스를 입력하세요."
          value={formatFaxNumber(form.formData.fax || "")}
          onChange={(v) => {
            const numbers = extractNumbers(v);
            form.handleChange("fax", numbers);
          }}
          onKeyDown={handleNumberKeyDown}
        />
      </div>
    </div>
  );
};

export default InputSection;
