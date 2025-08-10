import { Minus, Plus, X } from '@phosphor-icons/react';
import { useState, useRef, useEffect } from 'react';
import { handleQuantityInput } from '@/hooks/format-number';

interface ConnetionItemProps {
  name: string;
  unit: string;
  quantity: number;
  onDelete: () => void;
  onQuantityChange: (newQuantity: number) => void;
}

const ConnetionItem = ({
  name,
  unit,
  quantity,
  onDelete,
  onQuantityChange,
}: ConnetionItemProps) => {
  const [displayQuantity, setDisplayQuantity] = useState(quantity.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  // 입력 필드 너비 자동 조정 함수
  const adjustInputWidth = (input: HTMLInputElement) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = window.getComputedStyle(input).font;
      const textWidth = context.measureText(input.value || '0').width;
      const minWidth = 40; // 최소 너비
      const newWidth = Math.max(textWidth + 22, minWidth); // 22는 좌우 패딩
      input.style.width = `${newWidth}px`;
    }
  };

  // 초기 너비 설정
  useEffect(() => {
    if (inputRef.current) {
      adjustInputWidth(inputRef.current);
    }
  }, []);

  // 수량 증가
  const handleIncrease = () => {
    const newQuantity = quantity + 0.5;
    onQuantityChange(newQuantity);
    setDisplayQuantity(newQuantity.toString());

    // 너비 자동 조정
    if (inputRef.current) {
      setTimeout(() => adjustInputWidth(inputRef.current!), 0);
    }
  };

  // 수량 감소
  const handleDecrease = () => {
    if (quantity > 0) {
      const newQuantity = quantity - 0.5;
      onQuantityChange(newQuantity);
      setDisplayQuantity(newQuantity.toString());

      // 너비 자동 조정
      if (inputRef.current) {
        setTimeout(() => adjustInputWidth(inputRef.current!), 0);
      }
    }
  };

  // 직접 입력
  const handleQuantityInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    const result = handleQuantityInput(value);

    setDisplayQuantity(result.displayValue);
    if (result.isValid && result.numericValue > 0) {
      onQuantityChange(result.numericValue);
    }

    // 입력 필드 너비 자동 조정
    adjustInputWidth(e.target);
  };

  // 입력 완료 시 포커스 아웃
  const handleBlur = () => {
    const result = handleQuantityInput(displayQuantity);

    if (result.isValid && result.numericValue > 0) {
      setDisplayQuantity(result.displayValue);
      onQuantityChange(result.numericValue);
    } else {
      // 유효하지 않은 값이면 기본값으로 설정
      setDisplayQuantity('1');
      onQuantityChange(1);
    }

    // 너비 자동 조정
    if (inputRef.current) {
      setTimeout(() => adjustInputWidth(inputRef.current!), 0);
    }
  };

  return (
    <div className="flex justify-between items-center h-13 px-3 rounded-[8px] border border-lg">
      <p className="Me_body-1 text-dg">{name}</p>
      {/* 오른쪽 */}
      <div className="flex items-center gap-2.5">
        <p className="Re_body-2 text-gr">사용 수량</p>
        <div className="flex items-center gap-1">
          <button
            className="Me_body-1 text-dg w-8 h-8 flex justify-center items-center rounded-full border border-lg hover:bg-bg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDecrease}
            disabled={quantity <= 0}
          >
            <Minus size={16} className="text-dg" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={displayQuantity}
            onChange={handleQuantityInputChange}
            onBlur={handleBlur}
            className="Me_body-1 text-dg px-[11px] text-center border-none outline-none bg-transparent"
            placeholder="(필수)"
          />
          <button
            className="Me_body-1 text-dg w-8 h-8 flex justify-center items-center rounded-full border border-lg hover:bg-bg"
            onClick={handleIncrease}
          >
            <Plus size={16} className="text-dg" />
          </button>
        </div>
        <p className="Me_body-1 text-dg">{unit}</p>
        <button
          onClick={onDelete}
          className="cursor-pointer w-9 h-9 flex justify-center items-center rounded-[8px] hover:bg-bg"
        >
          <X size={16} className="text-gr" />
        </button>
      </div>
    </div>
  );
};

export default ConnetionItem;
