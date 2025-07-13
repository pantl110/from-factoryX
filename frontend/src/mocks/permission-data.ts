import {
  InvitationStatusType,
  PermissionRoleType,
} from '@/app/(with-layout)/setting/system-setting/permission/types'

export interface PermissionDataModel {
  id: number
  invitationStatus: InvitationStatusType
  name?: string
  email: string
  permission: PermissionRoleType
  date: string
}

export const permissionData: PermissionDataModel[] = [
  {
    id: 1,
    invitationStatus: '완료',
    name: '김찰스',
    email: 'hihi@caompany.com',
    permission: '운영자',
    date: '2025-06-15',
  },
  {
    id: 2,
    invitationStatus: '대기 중',
    name: undefined,
    email: 'hello@caompas.com',
    permission: '조회자',
    date: '2025-06-13',
  },
  {
    id: 3,
    invitationStatus: '완료',
    name: undefined,
    email: 'bye@company.com',
    permission: '운영자',
    date: '2025-06-11',
  },
  {
    id: 4,
    invitationStatus: '완료',
    name: '이영희',
    email: 'lee.yh@example.com',
    permission: '조회자',
    date: '2025-06-10',
  },
  {
    id: 5,
    invitationStatus: '대기 중',
    name: undefined,
    email: 'new.invite@sample.com',
    permission: '운영자',
    date: '2025-06-16',
  },
  {
    id: 6,
    invitationStatus: '완료',
    name: '박민수',
    email: 'minsu.park@company.com',
    permission: '조회자',
    date: '2025-06-17',
  },
  {
    id: 7,
    invitationStatus: '완료',
    name: '최지훈',
    email: 'jihoon.choi@company.com',
    permission: '운영자',
    date: '2025-06-18',
  },
  {
    id: 8,
    invitationStatus: '대기 중',
    name: '정유진',
    email: 'yujin.jung@company.com',
    permission: '조회자',
    date: '2025-06-19',
  },
  {
    id: 9,
    invitationStatus: '완료',
    name: '한가람',
    email: 'garam.han@company.com',
    permission: '운영자',
    date: '2025-06-20',
  },
  {
    id: 10,
    invitationStatus: '대기 중',
    name: '이수빈',
    email: 'soobin.lee@company.com',
    permission: '조회자',
    date: '2025-06-21',
  },
]
