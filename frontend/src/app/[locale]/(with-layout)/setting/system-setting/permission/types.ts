// 설정의 권한 초대 상태
export type InvitationStatusType = 'invited' | 'active';

// 설정의 권한 종류
export type PermissionRoleType =
  | '시스템 관리자'
  | '운영자'
  | '조회자'
  | '생산관리자';

export interface AuthInfoModel {
  type: PermissionRoleType;
  description: string;
  color:
    | 'blue'
    | 'red'
    | 'green'
    | 'orange'
    | 'yellow'
    | 'purple'
    | 'gray'
    | 'white'
    | 'whiteOutline';
  chipColor: {
    text: string;
    bg: string;
    hover: string;
  };
}

export const PermissionRoleInfo: Record<PermissionRoleType, AuthInfoModel> = {
  '시스템 관리자': {
    type: '시스템 관리자',
    description:
      '모든 메뉴와 설정에 접근할 수 있어요.\n사용자 관리, 문서 생성, 권한 설정까지 모두 가능해요.',
    color: 'purple',
    chipColor: {
      text: 'text-purple',
      bg: 'bg-purple-8',
      hover: 'hover:bg-purple-8',
    },
  },
  운영자: {
    type: '운영자',
    description:
      '주요 기능(견적서, 생산 관리 등)에 접근할 수 있어요.\n시스템 설정을 제외한 대부분의 작업을 수행할 수 있어요.',
    color: 'blue',
    chipColor: {
      text: 'text-primary',
      bg: 'bg-primary-8',
      hover: 'hover:bg-secondary-hover',
    },
  },
  생산관리자: {
    type: '생산관리자',
    description:
      '생산 계획과 작업지시 등 생산 관련 기능에 접근할 수 있어요.\n생산 진행 관리와 관련된 대부분의 업무를 수행할 수 있어요.',
    color: 'green',
    chipColor: {
      text: 'text-green',
      bg: 'bg-green-8',
      hover: 'hover:bg-green-hover',
    },
  },
  조회자: {
    type: '조회자',
    description:
      '데이터를 열람만 할 수 있어요. 생성, 수정, 삭제 권한은 없어요.',
    color: 'yellow',
    chipColor: {
      text: 'text-yellow',
      bg: 'bg-yellow-8',
      hover: 'hover:bg-yellow-hover',
    },
  },
};
