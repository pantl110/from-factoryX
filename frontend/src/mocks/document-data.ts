import { DocumentType } from "@/app/(with-layout)/document/types";

export interface DocumentDataModel {
  id: string;
  documentType: DocumentType;
  companyName: string;
  date: string;
}

const documentData: DocumentDataModel[] = [
  {
    id: "a1b2c3d4-0001-0000-0000-000000000001",
    documentType: "주문서",
    companyName: "플라스틱이 좋아",
    date: "2025-06-31",
  },
  {
    id: "a1b2c3d4-0002-0000-0000-000000000002",
    documentType: "생산지시서",
    companyName: "다이몰드",
    date: "2024-06-31",
  },
  {
    id: "a1b2c3d4-0003-0000-0000-000000000003",
    documentType: "거래명세서",
    companyName: "금형마스터",
    date: "2025-06-31",
  },
  {
    id: "a1b2c3d4-0004-0000-0000-000000000004",
    documentType: "매출 세금계산서",
    companyName: "테크파츠",
    date: "2025-06-31",
  },
  {
    id: "a1b2c3d4-0005-0000-0000-000000000005",
    documentType: "매입 세금계산서",
    companyName: "테크파츠",
    date: "2025-06-31",
  },
];

export default documentData;
