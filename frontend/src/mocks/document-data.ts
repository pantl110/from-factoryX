import { DocumentType } from "@/app/(with-layout)/document/types";

export interface DocumentDataModel {
  documentType: DocumentType;
  companyName: string;
  date: string;
}

const documentData: DocumentDataModel[] = [
  {
    documentType: "주문서",
    companyName: "플라스틱이 좋아",
    date: "2025-06-31",
  },
  {
    documentType: "생산지시서",
    companyName: "다이몰드",
    date: "2024-06-31",
  },
  {
    documentType: "거래명세서",
    companyName: "금형마스터",
    date: "2025-06-31",
  },
  {
    documentType: "매출 세금계산서",
    companyName: "테크파츠",
    date: "2025-06-31",
  },
  {
    documentType: "매입 세금계산서",
    companyName: "테크파츠",
    date: "2025-06-31",
  },
];

export default documentData;
