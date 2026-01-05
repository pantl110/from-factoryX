import { MoBtn } from '@/ui';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

const ScanItem = () => {
  const t = useTranslations('mobile.delivery.scan');
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const quotationProductId = params?.id || '';

  return (
    <div className="flex flex-col gap-3">
      <h5 className="m-Heading-5c">{t('productLotNumber')}</h5>
      <MoBtn
        text={t('viewDetail')}
        variant="outline"
        width="w-full"
        big
        onClick={() => {
          router.push(`/delivery/${quotationProductId}/detail`);
        }}
      />
    </div>
  );
};

export default ScanItem;
