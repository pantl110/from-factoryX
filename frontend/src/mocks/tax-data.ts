import { TaxDocumentType } from "@/types/status-type";

export interface TaxDataModel {
  id: number;
  taxType: TaxDocumentType;
  date: string;
  company: string;
  supplyAmount: string;
  taxAmount: string;
  totalAmount: string;
}

export const taxData: TaxDataModel[] = [
  {
    id: 1,
    taxType: "매출",
    date: "2025-06-04",
    company: "플라스틱이 좋아",
    supplyAmount: "550,000",
    taxAmount: "55,000",
    totalAmount: "605,000",
  },
  {
    id: 2,
    taxType: "매입",
    date: "2025-06-03",
    company: "메탈리카",
    supplyAmount: "1,200,000",
    taxAmount: "120,000",
    totalAmount: "1,320,000",
  },
  {
    id: 3,
    taxType: "매출",
    date: "2025-06-02",
    company: "나무와 사람들",
    supplyAmount: "780,000",
    taxAmount: "78,000",
    totalAmount: "858,000",
  },
  {
    id: 4,
    taxType: "매입",
    date: "2025-06-01",
    company: "스틸하트",
    supplyAmount: "2,500,000",
    taxAmount: "250,000",
    totalAmount: "2,750,000",
  },
  {
    id: 5,
    taxType: "매출",
    date: "2025-05-31",
    company: "유리공예",
    supplyAmount: "300,000",
    taxAmount: "30,000",
    totalAmount: "330,000",
  },
];
