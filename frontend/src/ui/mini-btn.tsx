'use client';

import clsx from 'clsx';
import { IconProps } from '@phosphor-icons/react';
import { ButtonHTMLAttributes } from 'react';

interface MiniBtnProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'className' | 'children'
  > {
  text: string;
  textColor?: string;
  bgColor?: string;
  hoverColor?: string;
  borderColor?: string;
  icon?: React.ComponentType<IconProps>;
  iconPosition?: 'left' | 'right';
  iconColor?: string;
  iconWeight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  iconSize?: number;
  gap?: string;
  width?: string;
  height?: string;
  variant?:
    | 'primary'
    | 'secondary'
    | 'red'
    | 'white'
    | 'whiteOutline'
    | 'hoverWhite'
    | 'ghost';
  justifyBetween?: boolean;
  padding?: string;
  textStyle?: string;
}

const MiniBtn = ({
  text,
  textColor,
  bgColor = 'bg-transparent',
  hoverColor,
  borderColor,
  icon: Icon,
  iconPosition = 'left',
  iconColor,
  iconWeight = 'regular',
  iconSize = 20,
  gap = 'gap-2',
  width = 'w-fit',
  height = 'h-10',
  variant,
  justifyBetween = false,
  padding = 'px-4',
  textStyle = 'Me_Body-3',
  ...rest
}: MiniBtnProps) => {
  const borderClass = borderColor ? `border ${borderColor}` : '';
  const positionClass = iconPosition === 'right' ? 'flex-row-reverse' : '';
  const justifyClass = justifyBetween ? 'justify-between' : 'justify-center';

  // variant가 있을 때만 색상 적용, 없으면 기존 방식 사용
  const getVariantStyles = () => {
    if (!variant) return {};

    switch (variant) {
      case 'primary':
        return {
          bg: 'bg-primary',
          text: 'text-white',
          hover: 'hover:bg-primary-hover',
        };
      case 'secondary':
        return {
          bg: 'bg-primary-8',
          text: 'text-primary',
          hover: 'hover:bg-secondary-hover',
        };
      case 'red':
        return {
          bg: 'bg-red-8',
          text: 'text-red',
          hover: 'hover:bg-red-hover',
        };
      case 'white':
        return {
          bg: '',
          text: 'text-sv',
          hover: 'hover:bg-bg',
        };
      case 'whiteOutline':
        return {
          bg: 'bg-wh',
          text: 'text-dg',
          hover: 'hover:bg-bg',
          border: 'border border-lg',
        };
      case 'hoverWhite':
        return {
          bg: '',
          text: 'text-dg',
          hover: 'hover:bg-wh',
          border: 'border border-lg',
        };
      case 'ghost':
        return {
          bg: '',
          text: 'text-sv',
          hover: 'hover:text-red',
        };
      default:
        return {};
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <button
      className={clsx(
        'rounded-md transition-slow flex items-center',
        gap,
        textStyle,
        padding,
        height,
        width,
        positionClass,
        justifyClass,
        {
          // disabled 상태
          'bg-lg text-gr': rest.disabled,
          'cursor-pointer': !rest.disabled,

          // variant가 있을 때 색상 적용
          [variantStyles.bg || '']: variant && !rest.disabled,
          [variantStyles.text || '']: variant && !rest.disabled,
          [variantStyles.hover || '']: variant && !rest.disabled,
          [variantStyles.border || '']: variant && variantStyles.border,

          // variant가 없을 때 기존 방식
          [bgColor || '']: !variant && !rest.disabled,
          [textColor || '']: !variant && !rest.disabled,
          [hoverColor || '']: !variant && !rest.disabled,
        },
        borderClass
      )}
      {...rest}
    >
      {Icon && (
        <Icon
          size={iconSize}
          weight={iconWeight}
          className={`transition-slow ${rest.disabled ? 'text-gr' : iconColor}`}
        />
      )}
      <span>{text}</span>
    </button>
  );
};

export default MiniBtn;
