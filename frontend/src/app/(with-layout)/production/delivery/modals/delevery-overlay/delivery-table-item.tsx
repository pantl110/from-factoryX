import InfoLabelValue from '@/ui/info-label-value';
interface DeliveryTableItemProps {
  data: {
    companyName: string;
    productName: string;
    spec: string;
    unit: string;
    quantity: number;
  };
  isLast?: boolean;
}
const DeliveryTableItem = ({
  data,
  isLast = false,
}: DeliveryTableItemProps) => {
  return (
    <div className={`flex flex-col ${isLast ? '' : 'pb-8 border-b border-lg'}`}>
      <InfoLabelValue label="납품처" value={data.companyName} />
      <InfoLabelValue label="품목명" value={data.productName} />
      <InfoLabelValue label="규격" value={data.spec} />
      <InfoLabelValue label="단위" value={data.unit} />
      <InfoLabelValue label="납품수량" value={data.quantity} />
    </div>
  );
};

export default DeliveryTableItem;
