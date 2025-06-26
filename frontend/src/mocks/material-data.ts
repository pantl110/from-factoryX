export interface MaterialDataModel {
  id: number | null;
  materialName: string;
  size: string;
  usageQuantity: number | null;
  unitPrice?: number | null;
}

export const materialData: MaterialDataModel[] = [
  {
    id: 1,
    materialName: "플라스틱 A",
    size: "500ml",
    usageQuantity: 100,
    unitPrice: 5000,
  },
  {
    id: 2,
    materialName: "플라스틱 B",
    size: "500ml",
    usageQuantity: 100,
    unitPrice: 5000,
  },
  {
    id: 3,
    materialName: "플라스틱 C",
    size: "500ml",
    usageQuantity: 100,
    unitPrice: 5000,
  },
];
