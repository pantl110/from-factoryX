"use client";

import Input from "@/ui/input";
import {
  Controller,
  UseFormSetValue,
  FieldErrors,
  Control,
} from "react-hook-form";
import { useDropdownFilter } from "@/hooks/use-dropdown-filter";
import { clientData } from "@/mocks/client-data";
import { ClientNameDropdown } from "@/ui/dropdown/client-name-dropdown";
import { forwardRef, useEffect } from "react";
import { ClientDataModel } from "@/types/data-model";
import { InputMask } from "@react-input/mask";
import {
  formatBusinessNumber,
  formatPhoneNumber,
  formatFaxNumber,
} from "@/hooks/format-number";

interface InputSectionProps {
  clientDataParam: string | null;
  setValue: UseFormSetValue<ClientDataModel>;
  errors: FieldErrors<ClientDataModel>;
  control: Control<ClientDataModel>;
}

const BusinessNumberInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ showError, ...props }, ref) => (
  <Input
    label="사업자등록번호"
    placeholder="사업자등록번호를 입력하세요."
    required
    ref={ref}
    {...props}
    showError={showError}
  />
));
BusinessNumberInput.displayName = "BusinessNumberInput";
const PhoneInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>((props, ref) => (
  <Input
    placeholder="담당자 연락처를 입력하세요."
    label="담당자 연락처"
    ref={ref}
    {...props}
  />
));
PhoneInput.displayName = "PhoneInput";
const FaxInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>((props, ref) => (
  <Input
    label="담당자 팩스"
    placeholder="담당자 팩스를 입력하세요."
    ref={ref}
    {...props}
  />
));
FaxInput.displayName = "FaxInput";

const InputSection = ({
  clientDataParam,
  setValue,
  errors,
  control,
}: InputSectionProps) => {
  const {
    setInput: setCompanyNameInput,
    isOpen: isCompanyNameDropdownOpen,
    setIsOpen: setIsCompanyNameDropdownOpen,
    filtered: filteredClients,
    handleSelect: handleCompanyNameSelect,
  } = useDropdownFilter(clientData, (item) => item.companyName);

  useEffect(() => {
    if (clientDataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(clientDataParam));
        Object.entries(data).forEach(([key, value]) => {
          if (key === "businessNumber") {
            setValue(
              "businessNumber",
              formatBusinessNumber(String(value ?? "")),
            );
          } else if (key === "contact") {
            setValue("contact", formatPhoneNumber(String(value ?? "")));
          } else if (key === "fax") {
            setValue("fax", formatFaxNumber(String(value ?? "")));
          } else if (key === "companyName") {
            setValue("companyName", String(value ?? ""));
          } else {
            setValue(key as string, value ?? "");
          }
        });
      } catch {
        // 파싱 에러 무시
      }
    }
  }, [clientDataParam, setValue]);

  const handleSelectClient = (item: ClientDataModel) => {
    handleCompanyNameSelect(item);

    // 선택한 거래처 정보로 폼 자동 채우기
    setValue("companyName", item.companyName);
    setValue(
      "businessNumber",
      formatBusinessNumber(String(item.businessNumber ?? "")),
    );
    setValue("representativeName", item.representativeName);
    setValue("dueDate", item.dueDate);
    setValue("responsibleName", item.responsibleName);
    setValue("companyAddress", item.companyAddress);
    setValue("deliveryAddress", item.deliveryAddress || "");
    setValue("responsibleName", item.responsibleName);
    setValue("email", item.email);
    setValue("contact", formatPhoneNumber(String(item.contact ?? "")));
    setValue("fax", formatFaxNumber(String(item.fax ?? "")));

    setIsCompanyNameDropdownOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Controller
            name="companyName"
            control={control}
            rules={{ required: true }}
            render={({ field }) => {
              const handleCompanyNameBlur = () =>
                setTimeout(() => setIsCompanyNameDropdownOpen(false), 150);
              return (
                <Input
                  label="거래처명"
                  placeholder="거래처명을 입력하세요."
                  required
                  showError={!!errors.companyName}
                  value={field.value || ""}
                  onChange={(value: string) => {
                    field.onChange(value);
                    setCompanyNameInput(value);
                  }}
                  onFocus={() => setIsCompanyNameDropdownOpen(true)}
                  onBlur={handleCompanyNameBlur}
                  ref={field.ref}
                  name={field.name}
                />
              );
            }}
          />
          {isCompanyNameDropdownOpen && filteredClients.length > 0 && (
            <div className="absolute left-0 top-21 z-10 w-full">
              <ClientNameDropdown
                items={filteredClients}
                onSelect={handleSelectClient}
                width="w-full"
              />
            </div>
          )}
        </div>
        <div className="flex-1">
          <Controller
            name="businessNumber"
            control={control}
            rules={{ required: true }}
            render={({ field }) => {
              return (
                <InputMask
                  component={BusinessNumberInput}
                  mask="000-00-00000"
                  replacement={{ 0: /[0-9]/ }}
                  {...field}
                  showError={!!errors.businessNumber}
                />
              );
            }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Controller
          name="representativeName"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              label="대표자명"
              placeholder="대표자명을 입력하세요."
              required
              showError={!!errors.representativeName}
              {...field}
            />
          )}
        />
        <Controller
          name="dueDate"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              label="납기일자"
              required
              type="date"
              showError={!!errors.dueDate}
              {...field}
            />
          )}
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
        <Controller
          name="companyAddress"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              label="회사주소"
              placeholder="회사주소를 입력하세요."
              required
              showError={!!errors.companyAddress}
              {...field}
            />
          )}
        />
      </div>
      <div className="flex gap-2">
        <Controller
          name="deliveryAddress"
          control={control}
          render={({ field }) => (
            <Input
              label="납품주소"
              placeholder="납품주소를 입력하세요."
              {...field}
            />
          )}
        />
      </div>
      <div className="flex gap-2">
        <Controller
          name="responsibleName"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              label="담당자명"
              placeholder="담당자명을 입력하세요."
              required
              showError={!!errors.responsibleName}
              {...field}
            />
          )}
        />
        <Controller
          name="email"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              label="담당자 이메일"
              placeholder="담당자 이메일을 입력하세요."
              required
              showError={!!errors.email}
              {...field}
            />
          )}
        />
      </div>
      <div className="flex gap-2">
        <Controller
          name="contact"
          control={control}
          render={({ field }) => {
            return (
              <InputMask
                component={PhoneInput}
                mask="000-0000-0000"
                replacement={{ 0: /[0-9]/ }}
                {...field}
              />
            );
          }}
        />
        <Controller
          name="fax"
          control={control}
          render={({ field }) => {
            return (
              <InputMask
                component={FaxInput}
                mask="000-0000-0000"
                replacement={{ 0: /[0-9]/ }}
                {...field}
              />
            );
          }}
        />
      </div>
    </div>
  );
};

export default InputSection;
