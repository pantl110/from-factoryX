import Dropdown from "@/ui/dropdown/dropdown";
import DropdownItem from "@/ui/dropdown/dropdown-item";
import React from "react";

export interface ProductItemModel {
  id: number;
  name: string;
  return_quantity: number;
}

export const productNameDropdownItems = [
  {
    id: 1,
    name: "플라스틱 판때기",
    return_quantity: 10,
  },
  {
    id: 2,
    name: "플라스틱 뚜껑 ",
    return_quantity: 10,
  },
  {
    id: 3,
    name: "플라스틱 판",
    return_quantity: 10,
  },
  {
    id: 4,
    name: "플라스틱 컵",
    return_quantity: 10,
  },
];

export const ProductNameDropdown = ({
  items,
  onSelect,
}: {
  items: ProductItemModel[];
  onSelect: (item: ProductItemModel) => void;
}) => {
  return (
    <Dropdown onClose={() => {}} width="w-[538px]">
      {items.map((item) => (
        <DropdownItem
          key={item.id}
          text={item.name}
          onClick={() => onSelect(item)}
        />
      ))}
    </Dropdown>
  );
};
