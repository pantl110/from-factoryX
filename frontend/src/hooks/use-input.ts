'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseInputProps {
  validate?: (value: string) => string
  initialValue?: string
  debounceTime?: number
}

export const useInput = ({
  validate,
  initialValue = '',
  debounceTime = 300,
}: UseInputProps = {}) => {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState('')
  const debounceTimerRef = useRef<number>(-1)

  // 유효성 검사
  const validateValue = useCallback(
    (valueToValidate: string) => {
      if (validate) {
        const errorMessage = validate(valueToValidate)
        setError(errorMessage)
      }
    },
    [validate]
  )

  // 입력 값 변경 시 유효성 검사
  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue)

      if (debounceTimerRef.current !== -1) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = window.setTimeout(() => {
        validateValue(newValue)
      }, debounceTime)
    },
    [validateValue, debounceTime]
  )

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== -1) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    value,
    error,
    handleChange,
  }
}
