import InfoLabelValue from "@/ui/info-label-value";
import { useState } from "react";

const initialInfo = {
  materialName: "플라스틱",
  materialCode: "123456",
  size: "500ml",
  unit: "EA",
  currentStock: "5,000",
  minStock: "2,000",
  status: "충분",
  date: "2025-05-26",
  location: "A동 자재실 랙3번",
};

const MaterialInfo = () => {
  const [info, setInfo] = useState(initialInfo);

  const handleChange =
    (key: keyof typeof info) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInfo((prev) => ({ ...prev, [key]: e.target.value }));
    };

  return (
    <div className="flex flex-col">
      <div className="flex">
        <InfoLabelValue
          label="자재명"
          value={info.materialName ?? ""}
          isEditing={true}
          onChange={handleChange("materialName")}
        />
        <InfoLabelValue
          label="자재 코드"
          value={info.materialCode ?? ""}
          isEditing={true}
          onChange={handleChange("materialCode")}
        />
      </div>
      <div className="flex">
        <InfoLabelValue
          label="규격"
          value={info.size ?? ""}
          isEditing={true}
          onChange={handleChange("size")}
        />
        <InfoLabelValue
          label="단위"
          value={info.unit ?? ""}
          isEditing={true}
          onChange={handleChange("unit")}
        />
      </div>
      <div className="flex">
        <InfoLabelValue
          label="현재 재고"
          value={info.currentStock ?? ""}
          isEditing={true}
          onChange={handleChange("currentStock")}
        />
        <InfoLabelValue
          label="최소 재고"
          value={info.minStock ?? ""}
          isEditing={true}
          onChange={handleChange("minStock")}
        />
      </div>
      <div className="flex">
        <InfoLabelValue
          label="재고 상태"
          value={info.status ?? ""}
          chip={{
            status: "충분",
          }}
          isEditing={true}
          onChange={handleChange("status")}
        />
        <InfoLabelValue
          label="입고 일자"
          value={info.date ?? ""}
          isEditing={true}
          onChange={handleChange("date")}
          inputType="date"
        />
      </div>
      <InfoLabelValue
        label="창고 위치"
        value={info.location ?? ""}
        isEditing={true}
        onChange={handleChange("location")}
      />
    </div>
  );
};

export default MaterialInfo;
