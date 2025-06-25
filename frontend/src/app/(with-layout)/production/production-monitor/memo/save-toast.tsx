import Toast from "@/ui/toast";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";

const SaveToast = () => {
  return (
    <Toast
      icon={<WarningCircle size={20} className="text-primary" />}
      text="변경 사항이 저장되었어요."
      subtext="수정한 메모 내용이 반영되었습니다."
      type="primary"
    />
  );
};

export default SaveToast;
