import { useState } from "react";

interface UseInputProps {
  initialValue?: string;
  validate?: (value: string) => string;
}

export const useInput = ({
  initialValue = "",
  validate,
}: UseInputProps = {}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");

  const handleChange = (newValue: string) => {
    setValue(newValue);
    if (validate) {
      const errorMessage = validate(newValue);
      setError(errorMessage);
    }
  };

  const reset = () => {
    setValue(initialValue);
    setError("");
  };

  return {
    value,
    error,
    handleChange,
    reset,
    setValue,
    setError,
  };
};
