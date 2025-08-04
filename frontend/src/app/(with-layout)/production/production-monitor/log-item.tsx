import { ProjectLogResponseModel } from '@/types/data-model';
import { CubeFocus, NoteBlankIcon, Swap } from '@phosphor-icons/react/dist/ssr';

// 상대적 시간 포맷팅 함수
const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // 1분 미만
  if (diffInMinutes < 1) {
    return '방금 전';
  }

  // 1시간 미만
  if (diffInHours < 1) {
    return `${diffInMinutes}분 전`;
  }

  // 24시간 미만
  if (diffInDays < 1) {
    return `${diffInHours}시간 전`;
  }

  // 어제인지 확인
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `어제 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  // 7일 이내
  if (diffInDays <= 7) {
    return `${diffInDays}일 전`;
  }

  // 7일 초과 ~ 올해 안
  const currentYear = now.getFullYear();
  if (date.getFullYear() === currentYear) {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  }

  // 작년 이전
  return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
};

interface LogItemProps {
  onClick?: () => void;
  isSelected?: boolean;
  log: ProjectLogResponseModel;
}

const LogItem = ({ onClick, isSelected, log }: LogItemProps) => {
  // Korean type to English icon key mapping
  const getIconKey = (type: string) => {
    switch (type) {
      case '메모':
        return 'memo';
      case '반품':
        return 'return';
      case '계획변경':
        return 'planChange';
      default:
        return 'memo';
    }
  };

  const icon = {
    memo: (
      <NoteBlankIcon
        size={24}
        className={`${isSelected ? 'text-primary' : 'text-sv'}`}
        weight={isSelected ? 'fill' : 'regular'}
      />
    ),
    return: (
      <Swap
        size={24}
        className={`${isSelected ? 'text-primary' : 'text-sv'}`}
        weight={isSelected ? 'fill' : 'regular'}
      />
    ),
    planChange: (
      <CubeFocus
        size={24}
        className={`${isSelected ? 'text-primary' : 'text-sv'}`}
        weight={isSelected ? 'fill' : 'regular'}
      />
    ),
  };

  return (
    <div
      className={`border rounded-lg p-3 ${isSelected ? 'bg-primary-8 border-primary' : 'border-lg'} hover:border-primary`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      <div className="flex flex-col gap-5 px-1">
        <div className="flex gap-2">
          <div className="w-6 h-6">
            {icon[getIconKey(log.type) as keyof typeof icon]}
          </div>
          <h4 className="Heading-4 text-dg">{log.title}</h4>
        </div>
        <div className="flex w-full items-center justify-between gap-2">
          <p
            className={`Me_Body-2 truncate ${isSelected ? 'text-dg' : 'text-sv'}`}
          >
            {log.content}
          </p>
          <p className="flex items-end Re_Body-1 text-sv flex-shrink-0">
            {/* {formatRelativeTime(log.created_at)} */}
            3시간 전
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogItem;
