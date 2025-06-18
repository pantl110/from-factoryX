import FacilityTableHeader from "./facility-table-header";
import FacilityTableItem from "./facility-table-item";

const FacilityTable = () => {
  return (
    <div className="w-full px-10">
      <FacilityTableHeader />
      <FacilityTableItem
        status="가동중"
        name="1호기"
        products="플라스틱 컵 외 3개"
        priority={1}
      />
      <FacilityTableItem
        status="가동 대기"
        name="2호기"
        products="플라스틱 컵 외 3개"
        priority={2}
      />
      <FacilityTableItem
        status="가동중"
        name="3호기"
        products="플라스틱 컵 외 3개"
        priority={3}
      />
      <FacilityTableItem
        status="가동 대기"
        name="4호기"
        products="플라스틱 컵 외 3개"
        priority={4}
      />
      <FacilityTableItem
        status="가동 대기"
        name="5호기"
        products="플라스틱 컵 외 3개"
        priority={5}
      />
    </div>
  );
};

export default FacilityTable;
