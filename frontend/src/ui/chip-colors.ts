export const chipColorClasses = {
  red: 'bg-red-8 text-red',
  green: 'bg-green-8 text-green',
  orange: 'bg-orange-8 text-orange',
  yellow: 'bg-yellow-8 text-yellow',
  purple: 'bg-purple-8 text-purple',
  gray: 'bg-bg text-dg',
  white: 'bg-wh text-dg',
  whiteOutline: 'bg-wh text-dg border border-lg',
  blue: 'bg-blue-8 text-blue',
  primary: 'bg-primary text-wh',
} as const;

export type ChipColorType = keyof typeof chipColorClasses;
