import { useState } from "react";

interface UseFormProps<T> {
  initialData: T;
  validationRules?: Partial<Record<keyof T, (value: string) => boolean>>;
}

export const useForm = <T extends Record<string, any>>({
  initialData,
  validationRules = {},
}: UseFormProps<T>) => {
  const [formData, setFormData] = useState<T>(initialData);
  const [showErrors, setShowErrors] = useState(false);

  const validateField = (field: keyof T, value: string): boolean => {
    const validator = validationRules[field];
    return validator ? validator(value) : true;
  };

  const handleChange = (field: keyof T, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const isValid = Object.keys(validationRules).every((field) =>
      validateField(field as keyof T, formData[field as keyof T]),
    );
    return isValid;
  };

  const handleSubmit = (onSuccess: () => void) => {
    if (!validateForm()) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    onSuccess();
  };

  //   const reset = () => {
  //     setFormData(initialData);
  //     setShowErrors(false);
  //   };

  return {
    formData,
    showErrors,
    handleChange,
    handleSubmit,
    // reset,
  };
};
