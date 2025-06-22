import {
  InvitationStatusType,
  PermissionRoleType,
} from "@/app/(with-layout)/setting/system-setting/permission/types";

export interface PermissionDataModel {
  id: number;
  invitationStatus: InvitationStatusType;
  name: string | null;
  email: string;
  permission: PermissionRoleType;
  date: string;
}

export const permissionData: PermissionDataModel[] = [
  {
    id: 1,
    invitationStatus: "완료",
    name: "김찰스",
    email: "hihi@caompany.com",
    permission: "운영자",
    date: "2025-06-15",
  },
  {
    id: 2,
    invitationStatus: "대기 중",
    name: null,
    email: "hello@caompas.com",
    permission: "조회자",
    date: "2025-06-13",
  },
  {
    id: 3,
    invitationStatus: "만료",
    name: null,
    email: "bye@company.com",
    permission: "운영자",
    date: "2025-06-11",
  },
  {
    id: 4,
    invitationStatus: "완료",
    name: "이영희",
    email: "lee.yh@example.com",
    permission: "조회자",
    date: "2025-06-10",
  },
  {
    id: 5,
    invitationStatus: "대기 중",
    name: null,
    email: "new.invite@sample.com",
    permission: "운영자",
    date: "2025-06-16",
  },
];
