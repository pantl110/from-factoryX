import { CaretRight } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

interface TodoListItemProps {
  title: string;
  count: number;
  onClick: () => void;
}

const TodoListItem = ({ title, count, onClick }: TodoListItemProps) => {
  const t = useTranslations('common');

  return (
    <button
      className="flex-1 flex flex-col gap-2.5 px-4 pt-4 pb-3 rounded-[8px] border border-lg"
      onClick={onClick}
    >
      <p className="m-Body-4 text-sv text-left">{title}</p>
      <div className="flex justify-between items-center">
        <p className="m-Body">
          {count}
          {t('count')}
        </p>
        <CaretRight size={16} className="text-bl" />
      </div>
    </button>
  );
};

export default TodoListItem;
