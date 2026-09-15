import Checkbox from '@/ui/checkbox';
import { ProductResponseModel } from '@/types/data-model';
import useSubscriptionStore from '@/store/subscription-store';
import useMemberStore from '@/store/member-store';
import { removeTrailingZeros } from '@/utils';
import { useTranslations } from 'next-intl';

interface TableItemProps {
  product: ProductResponseModel;
  onClick: () => void;
  checked: boolean;
  onToggle: () => void;
}

const TableItem = ({ product, onClick, checked, onToggle }: TableItemProps) => {
  const tCommon = useTranslations('common');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <div
      className="flex items-center h-14 border-b border-lg Me_Body-3 cursor-pointer hover:bg-bg transition-colors duration-200"
      onClick={onClick}
    >
      {!isViewer && hasSubscription() && (
        <Checkbox isChecked={checked} onToggle={onToggle} />
      )}
      <p className="flex-1 px-3 text-dg truncate" title={product.name}>
        {product.name}
      </p>
      <p className="flex-1 px-3 text-dg truncate" title={product.code}>
        {product.code}
      </p>
      <p className="flex-1 px-3 text-dg truncate" title={product.spec}>
        {product.spec}
      </p>
      <p className="flex-1 px-3 text-dg truncate" title={product.unit}>
        {product.unit}
      </p>
      <div className="flex-[0.8] px-3">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs ${
            product.tax_type === 'exempt'
              ? 'bg-orange-8 text-orange'
              : 'bg-blue-8 text-blue'
          }`}
        >
          {product.tax_type === 'exempt'
            ? tCommon('taxExempt')
            : tCommon('taxable')}
        </span>
        {product.tax_type_review_required && (
          <span className="ml-1 text-xs text-red">
            {tCommon('taxTypeReviewRequired')}
          </span>
        )}
      </div>
      <p
        className="flex-1 px-3 text-dg truncate"
        title={
          product.current_stock !== null && product.current_stock !== undefined
            ? removeTrailingZeros(product.current_stock)
            : '-'
        }
      >
        {product.current_stock !== null && product.current_stock !== undefined
          ? removeTrailingZeros(product.current_stock)
          : '-'}
      </p>
    </div>
  );
};

export default TableItem;
