export type PlanType = "FREE" | "BASIC" | "PARTNERS";

export interface PlanInfo {
  type: PlanType;
  title: string;
  price: string;
  description: string;
}

export const PLAN_INFO: Record<PlanType, PlanInfo> = {
  FREE: {
    type: "FREE",
    title: "무료 체험",
    price: "0",
    description:
      "모든 문서와 설정에 접근할 수 있어요.\n사용자 관리, 문서 생성, 권한 설정까지 모두 가능해요.",
  },
  BASIC: {
    type: "BASIC",
    title: "Basic",
    price: "50,000",
    description:
      "모든 문서와 설정에 접근할 수 있어요.\n사용자 관리, 문서 생성, 권한 설정까지 모두 가능해요.",
  },
  PARTNERS: {
    type: "PARTNERS",
    title: "Partners",
    price: "300,000",
    description:
      "세무 대리인과의 협업을 기반으로, 기장료를 포함한 세무관리 전반을 시스템을 통해 간편하게 처리할 수 있도록 설계했어요.\n매달 반복되는 회계 처리와 세무 신고 업무를 자동화하여, 세무대리인과의 실시간 소통도 지원해 효율적인 관리가 가능해요.",
  },
};
