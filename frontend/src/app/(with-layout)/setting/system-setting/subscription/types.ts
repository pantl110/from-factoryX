export type PlanType = 'FREE' | 'BASIC' | 'PARTNERS';

export interface PlanInfoModel {
  type: PlanType;
  title: string;
  price: number;
  description: string;
}

export interface SubscriptionModel {
  id: string;
  planType: PlanType;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL';
  autoRenew: boolean;
  startDate: string;
  endDate: string;
  nextBillingDate?: string;
  cardInfo?: {
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  };
}

export interface PaymentHistoryModel {
  id: string;
  date: string;
  card: string;
  amount: string;
  plan: PlanType;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

export const PLAN_INFO: Record<PlanType, PlanInfoModel> = {
  FREE: {
    type: 'FREE',
    title: '무료 체험',
    price: 0,
    description: `기본적인 기능을 모두 이용할 수 있어요.\n사용자 관리, 문서 작성, 권한 설정 등 핵심 기능이 모두 포함돼요.`,
  },
  BASIC: {
    type: 'BASIC',
    title: 'Basic',
    price: 50000,
    description: `기본적인 기능을 모두 이용할 수 있어요.\n사용자 관리, 문서 작성, 권한 설정 등 핵심 기능이 모두 포함돼요.`,
  },
  PARTNERS: {
    type: 'PARTNERS',
    title: 'Partners',
    price: 300000,
    description: `매달 반복되는 회계 업무, 이젠 자동으로 끝내세요.\n기장료 포함 세무 관리부터 세무대리인과의 실시간 협업까지 한 번에 처리할 수 있어요.`,
  },
};
