export interface MaterialDataModel {
  id: number;
  materialName: string;
  size: string;
  usageQuantity: number;
}

export const materialData: MaterialDataModel[] = [
  {
    id: 1,
    materialName: "플라스틱 A",
    size: "500ml",
    usageQuantity: 100,
  },
  {
    id: 2,
    materialName: "플라스틱 B",
    size: "500ml",
    usageQuantity: 100,
  },
  {
    id: 3,
    materialName: "플라스틱 C",
    size: "500ml",
    usageQuantity: 100,
  },
];
