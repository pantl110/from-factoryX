import { ProjectLogResponseModel } from '@/types/data-model';
import { formatRelativeTime } from '@/utils/format-relative-time';
import { CubeFocus, NoteBlankIcon, Swap } from '@phosphor-icons/react/dist/ssr';

interface LogItemProps {
  onClick?: () => void;
  isSelected?: boolean;
  log: ProjectLogResponseModel;
}

const LogItem = ({ onClick, isSelected, log }: LogItemProps) => {
  // Korean and English type to icon key mapping
  const getIconKey = (type: string) => {
    switch (type) {
      case 'memo':
        return 'memo';
      case 'refund':
        return 'return';
      case 'plan':
        return 'planChange';
      case 'date':
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
      <div className="flex flex-col gap-3 px-1">
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
            {formatRelativeTime(log.updated_at || log.created_at || '')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogItem;
