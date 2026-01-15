import { ListChecks } from '@phosphor-icons/react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Title from '../title';
import AlarmItem from '../alarm-item';
import useGetStaleConfirmedProjects from '@/hooks/project/use-get-stale-confirmed-projects';
import { getProductNamesDisplay } from '@/utils/get-product-names-display';
import { Spinner, NoHistoryBox } from '@/ui';

const formatChipText = (
  daysSinceConfirmed: number | null,
  t: (key: string, values?: Record<string, string | number>) => string
) => {
  if (!daysSinceConfirmed) {
    return t('checkConfirmationStatus');
  }

  return t('orderConfirmedForDays', { days: daysSinceConfirmed });
};

interface ConfirmationRequiredProps {
  hideWhenEmpty?: boolean;
  limit?: number;
}

const ConfirmationRequired = ({
  hideWhenEmpty = false,
  limit,
}: ConfirmationRequiredProps) => {
  const t = useTranslations('mobile.alarm.tabs');
  const tAlarm = useTranslations('mobile.alarm');
  const router = useRouter();
  const {
    data: projects = [],
    isLoading,
    error,
  } = useGetStaleConfirmedProjects();

  const limitedProjects =
    typeof limit === 'number' && limit > 0
      ? projects.slice(0, limit)
      : projects;
  const hasProjects = limitedProjects.length > 0;
  const shouldHideSection =
    hideWhenEmpty && !isLoading && limitedProjects.length === 0;

  // 로딩 중이고 프로젝트가 없을 때는 Title 포함 전체 숨김
  if (isLoading && !hasProjects) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (shouldHideSection) {
    return null;
  }

  const renderContent = () => {
    // 로딩 중일 때는 아무것도 표시하지 않음 (이미 위에서 Spinner 처리됨)
    if (isLoading || error) {
      return null;
    }

    // 데이터가 없을 때만 NoHistoryBox 표시
    if (!hasProjects) {
      return (
        <div className="px-6 pt-4">
          <NoHistoryBox text={tAlarm('noConfirmationNotifications')} />
        </div>
      );
    }

    return limitedProjects.map((project, index) => (
      <AlarmItem
        key={index}
        chipText={formatChipText(project.days_since_confirmed, tAlarm)}
        chipVariant="secondary"
        name={project.client_name ?? '-'}
        subText={getProductNamesDisplay(project.product_names ?? [])}
        onClick={() => {
          if (!project.project_id) {
            return;
          }
          router.push(`/order/${project.project_id}`);
        }}
      />
    ));
  };

  return (
    <div className="flex flex-col gap-1 pt-4">
      <Title
        icon={<ListChecks />}
        title={t('confirmationRequired')}
        count={projects.length}
      />

      {renderContent()}
    </div>
  );
};

export default ConfirmationRequired;
