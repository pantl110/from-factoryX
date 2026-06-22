export const getTabItemClass = (isActive: boolean): string =>
  `border-b-2 -mb-px ${
    isActive ? 'text-primary border-primary' : 'text-gr border-transparent'
  }`;
