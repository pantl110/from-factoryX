// 설정의 권한 초대 상태
export type InvitationStatusType = "완료" | "대기 중";
export const InvitationStatusColorMap: Record<InvitationStatusType, string> = {
  완료: "text-primary",
  "대기 중": "text-yellow",
};

// 설정의 권한 종류
export type PermissionRoleType = "시스템 관리자" | "운영자" | "조회자";

export interface AuthInfoModel {
  type: PermissionRoleType;
  description: string;
  chipColor: {
    bg: string;
    text: string;
    hover?: string;
  };
}

export const PermissionRoleInfo: Record<PermissionRoleType, AuthInfoModel> = {
  "시스템 관리자": {
    type: "시스템 관리자",
    description:
      "모든 메뉴와 설정에 접근할 수 있어요.\n사용자 관리, 문서 생성, 권한 설정까지 모두 가능해요.",
    chipColor: {
      bg: "bg-purple-8",
      text: "text-purple",
    },
  },
  운영자: {
    type: "운영자",
    description:
      "주요 기능(견적서, 생산 관리 등)에 접근할 수 있어요.\n시스템 설정을 제외한 대부분의 작업을 수행할 수 있어요.",
    chipColor: {
      bg: "bg-primary-8",
      text: "text-primary",
      hover: "hover:bg-secondary-hover",
    },
  },
  조회자: {
    type: "조회자",
    description:
      "데이터를 열람만 할 수 있어요. 생성, 수정, 삭제 권한은 없어요.",
    chipColor: {
      bg: "bg-yellow-8",
      text: "text-yellow",
      hover: "hover:bg-yellow-hover",
    },
  },
};
