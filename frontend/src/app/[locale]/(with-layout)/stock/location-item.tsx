import Image from 'next/image';
import { getRoleText, formatDate } from '@/utils';
import { Trash } from '@phosphor-icons/react';
import useSubscriptionStore from '@/store/subscription-store';
import useMemberStore from '@/store/member-store';
import { MemberRoleColorMap, MemberRoleType } from '@/types/status-type';
import { RoundChip, MiniBtn } from '@/ui';
import { useTranslations } from 'next-intl';

interface LocationItemProps {
  image: string;
  length: number;
  email?: string;
  role?: string;
  location?: string;
  memo?: string;
  createdAt?: string;
  updatedAt?: string;
  onClick?: () => void;
  onDelete?: () => void;
}
const LocationItem = ({
  image,
  length,
  email,
  role,
  location,
  memo,
  createdAt,
  updatedAt,
  onClick,
  onDelete,
}: LocationItemProps) => {
  const tCommon = useTranslations('common');
  const tPermission = useTranslations('setting.systemSetting.permission');
  const userRole = useMemberStore((state) => state.role);
  const userHasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );
  const canEdit = userRole !== 'viewer' && userHasSubscription();
  const roleColor = MemberRoleColorMap[role as MemberRoleType] || {
    bgColor: 'bg-bg',
    textColor: 'text-dg',
  };

  // role을 번역 키로 변환
  const getTranslatedRoleText = (role: string | null | undefined): string => {
    if (!role || role === '-') return '-';
    const roleKey = role as 'admin' | 'manager' | 'prod_manager' | 'viewer';
    return tPermission(`roles.${roleKey}`) || getRoleText(role);
  };

  const roleText = getTranslatedRoleText(role);

  return (
    <div className={`flex gap-5 items-center cursor-pointer`} onClick={onClick}>
      {/* 사진 */}
      <div className="relative shrink-0">
        {image ? (
          <Image
            src={typeof image === 'string' ? image : URL.createObjectURL(image)}
            width={110}
            height={110}
            className="w-[110px] h-[110px] object-cover rounded-[8px] border border-lg"
            alt={tCommon('preview')}
            quality={100}
            unoptimized={true}
          />
        ) : (
          <div className="w-[110px] h-[110px] bg-lg rounded-[8px] border border-lg" />
        )}
        {length > 1 && (
          <div className="rounded-bl-[4px] rounded-tr-[4px] bg-primary absolute top-0 right-0 w-5 h-5 flex items-center justify-center">
            <span className="Heading-5b text-wh">{`+${length - 1}`}</span>
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            <RoundChip
              text={roleText}
              variant="role"
              color={roleColor.color || 'gray'}
            />
            <span className="Heading-5 text-sv">
              {email?.split('@')[0] || '-'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="m-Body-4 text-gr">
              {updatedAt ? formatDate(updatedAt) : formatDate(createdAt || '-')}
            </span>
            {canEdit && (
              <MiniBtn
                text={tCommon('delete')}
                icon={Trash}
                iconPosition="right"
                iconSize={16}
                variant="ghost"
                textStyle="Re_body-2"
                gap="gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
              />
            )}
          </div>
        </div>
        <p className="m-Body-2 text-bl w-full truncate">{location || '-'}</p>
        <p className="m-Body-3 text-sv line-clamp-2 w-full min-h-[3rem]">
          {memo || '-'}
        </p>
      </div>
    </div>
  );
};

export default LocationItem;
