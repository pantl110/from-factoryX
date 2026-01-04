import { CalendarDots } from '@phosphor-icons/react';
import { useRouter } from '@/i18n/navigation';
import Title from '../title';
import AlarmItem from '../alarm-item';
import NoHistoryBox from '@/ui/no-history-box';
import useGetStaleConfirmedProjects from '@/hooks/project/use-get-stale-confirmed-projects';
import { getProductNamesDisplay } from '@/utils/get-product-names-display';

const formatChipText = (daysSinceConfirmed: number | null) => {
  if (!daysSinceConfirmed) {
    return '확정 상태를 확인해 주세요.';
  }

  return `주문이 ${daysSinceConfirmed}일째 확정 상태예요!`;
};

interface ConfirmationRequiredProps {
  hideWhenEmpty?: boolean;
  limit?: number;
}

const ConfirmationRequired = ({
  hideWhenEmpty = false,
  limit,
}: ConfirmationRequiredProps) => {
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

  if (shouldHideSection) {
    return null;
  }

  const renderContent = () => {
    if (isLoading && !hasProjects) {
      return <></>;
    }

    if (!hasProjects || error) {
      return (
        <div className="px-6 pt-4">
          <NoHistoryBox text="진행 필요 알림이 없어요." />
        </div>
      );
    }

    return limitedProjects.map((project, index) => (
      <AlarmItem
        key={index}
        chipText={formatChipText(project.days_since_confirmed)}
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
        icon={<CalendarDots />}
        title="진행 필요"
        count={projects.length}
      />

      {renderContent()}
    </div>
  );
};

export default ConfirmationRequired;
