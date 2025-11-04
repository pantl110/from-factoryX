import Chip from '@/ui/chip';
import Image from 'next/image';
import React from 'react';
import { getRoleText } from '@/utils/get-role-text';
import { DotsThree } from '@phosphor-icons/react';
import IconBtn from '@/ui/icon-btn';
import { formatDate } from '@/utils/format-number';

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
}: LocationItemProps) => {
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
            alt="미리보기"
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
            <Chip
              text={getRoleText(role || 'manager')}
              bgColor="bg-primary-8"
              textColor="text-primary"
              size="role"
            />
            <span className="Heading-5 text-sv">{email || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="m-Body-4 text-gr">
              {updatedAt ? formatDate(updatedAt) : formatDate(createdAt || '-')}
            </span>
            <IconBtn
              icon={DotsThree}
              size="w-4 h-4"
              iconSize={16}
              rounded="rounded-[4px]"
              onClick={() => {}}
            />
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
