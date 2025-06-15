export type PermissionType = "SYSTEM_ADMIN" | "OPERATOR" | "VIEWER";

export interface PermissionInfo {
  type: PermissionType;
  title: string;
  description: string;
  chipColor: {
    bg: string;
    text: string;
  };
}

export const PERMISSION_INFO: Record<PermissionType, PermissionInfo> = {
  SYSTEM_ADMIN: {
    type: "SYSTEM_ADMIN",
    title: "시스템 관리자",
    description:
      "모든 메뉴와 설정에 접근할 수 있어요.\n사용자 관리, 문서 생성, 권한 설정까지 모두 가능해요.",
    chipColor: {
      bg: "bg-purple-8",
      text: "text-purple",
    },
  },
  OPERATOR: {
    type: "OPERATOR",
    title: "운영자",
    description:
      "주요 기능(견적서, 생산 관리 등)에 접근할 수 있어요.\n시스템 설정을 제외한 대부분의 작업을 수행할 수 있어요.",
    chipColor: {
      bg: "bg-primary-8",
      text: "text-primary",
    },
  },
  VIEWER: {
    type: "VIEWER",
    title: "조회자",
    description:
      "데이터를 열람만 할 수 있어요. 생성, 수정, 삭제 권한은 없어요.",
    chipColor: {
      bg: "bg-yellow-8",
      text: "text-yellow",
    },
  },
};
