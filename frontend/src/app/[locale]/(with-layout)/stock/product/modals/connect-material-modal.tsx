import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import SearchInput from '@/ui/search-input';
import { MaterialNameDropdown } from '@/ui/dropdown/material-name-dropdown';
import { useState } from 'react';
import ManualAddMaterial from '../../material/modals/manual-add-material';
import {
  MaterialItemModel,
  MaterialResponseModel,
  UnitConversionModel,
} from '@/types/data-model';
import {
  useGetMaterial,
  useMaterialProduct,
  useCreateMaterial,
  useToast,
  useUnitConversionApi,
} from '@/hooks';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react';
import useMemberStore from '@/store/member-store';
import ConnetionItem from '../../modals/connetion-item';
import { useTranslations } from 'next-intl';

interface ConnectMaterialModalProps {
  onClose: () => void;
  productId: number | null;
  onSuccess?: () => void | Promise<void>;
  // 생성 모드일 때 선택/추가한 원자재를 상위로 전달하기 위한 콜백
  onStage?: (
    materials: Array<{
      id: number;
      name: string;
      code: string;
      spec: string;
      unit: string;
      quantityUnit?: string;
      quantity: number;
    }>
  ) => void;
  // 이미 제품과 연결되어 있는 원자재 ID 목록 (중복 방지용)
  connectedMaterialIds?: number[];
}

const ConnectMaterialModal = ({
  onClose,
  productId,
  onSuccess,
  onStage,
  connectedMaterialIds = [],
}: ConnectMaterialModalProps) => {
  const [input, setInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newMaterials, setNewMaterials] = useState<MaterialItemModel[]>([]); // 수동 추가한 새로운 원자재
  const [isManualAddMode, setIsManualAddMode] = useState(false);
  const { getMaterialList } = useGetMaterial();
  const { createMaterialProduct, isLoading: isConnecting } =
    useMaterialProduct();
  const { createMaterial, isLoading: isCreating } = useCreateMaterial();
  const { getByMaterial } = useUnitConversionApi();

  // 토스트
  const { isToastOpen, isVisible, showToast } = useToast();
  const [toastText, setToastText] = useState('');
  const [toastSubtext, setToastSubtext] = useState('');

  const factoryId = useMemberStore((state) => state.factoryId);
  const t = useTranslations('stock.product.modals.connectMaterial');
  const tCommon = useTranslations('common');
  const tStock = useTranslations('stock');

  const [selectedMaterials, setSelectedMaterials] = useState<
    MaterialItemModel[]
  >([]);
  const [conversionUnits, setConversionUnits] = useState<
    Record<number, string[]>
  >({});
  const [selectedQuantityUnits, setSelectedQuantityUnits] = useState<
    Record<string, string>
  >({});

  const loadMaterialConversionUnits = async (
    material: MaterialResponseModel
  ) => {
    const result = await getByMaterial(material.id);
    const units = new Set<string>([material.unit]);

    if (result.success && result.data) {
      result.data.forEach((conversion: UnitConversionModel) => {
        if (conversion.from_unit) units.add(conversion.from_unit);
        if (conversion.to_unit) units.add(conversion.to_unit);
      });
    }

    setConversionUnits((prev) => ({
      ...prev,
      [material.id]: Array.from(units),
    }));
  };

  // 자재 코드 중복 검사 함수 (비동기 - 자재 코드로 검색)
  const checkDuplicateMaterialCode = async (
    code: string,
    selectedMaterials: MaterialItemModel[] = [],
    newMaterials: MaterialItemModel[] = []
  ): Promise<boolean> => {
    // 현재 선택된 자재들 중에서 중복 확인
    const isSelectedDuplicate = selectedMaterials.some(
      (material) => material.code === code
    );

    if (isSelectedDuplicate) {
      return true;
    }

    // 새로 추가된 자재들 중에서 중복 확인
    const isNewDuplicate = newMaterials.some(
      (material) => material.code === code
    );

    if (isNewDuplicate) {
      return true;
    }

    // 자재 코드로 검색하여 존재하는지 확인
    if (!code || code.trim() === '') {
      return false;
    }

    try {
      const result = await getMaterialList({
        q: code,
        page: 1,
        page_size: 10,
      });

      if (result.success && result.data) {
        // 검색 결과에서 정확히 일치하는 코드가 있는지 확인
        const hasExactMatch = result.data.data.some(
          (material) => material.code === code
        );
        return hasExactMatch;
      }
    } catch {
      // 에러 발생 시 중복이 아닌 것으로 처리
      return false;
    }

    return false;
  };

  // 원자재 선택 시
  const handleSelectMaterial = (item: MaterialResponseModel) => {
    setInput('');
    // 이미 연결되어 있는 자재면 토스트 띄우고 추가하지 않음
    if (connectedMaterialIds.includes(item.id)) {
      setToastText(t('toast.alreadyConnected'));
      showToast();
      setIsDropdownOpen(false);
      return;
    }
    setSelectedMaterials((prev) => {
      if (!prev.some((mat) => mat.code === item.code)) {
        // MaterialResponseModel을 MaterialItemModel로 변환
        const materialItem: MaterialItemModel = {
          id: item.id,
          name: item.name,
          code: item.code,
          spec: item.spec,
          unit: item.unit,
          quantity: null, // 사용자가 입력할 수량
          price: null, // 사용자가 입력할 단가
        };
        return [...prev, materialItem];
      }
      return prev;
    });
    setSelectedQuantityUnits((prev) => ({
      ...prev,
      [item.code]: prev[item.code] || item.unit,
    }));
    void loadMaterialConversionUnits(item);
    setIsDropdownOpen(false);
  };

  const handleRemoveMaterial = (code: string) => {
    setSelectedMaterials((prev) => prev.filter((mat) => mat.code !== code));
    setSelectedQuantityUnits((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });
  };

  const handleRemoveNewMaterial = (code: string) => {
    setNewMaterials((prev) => prev.filter((mat) => mat.code !== code));
  };

  // 원자재 수량 변경
  const handleMaterialQuantityChange = (code: string, newQuantity: number) => {
    // 기존 원자재에서 찾기
    setSelectedMaterials((prev) =>
      prev.map((mat) =>
        mat.code === code ? { ...mat, quantity: newQuantity } : mat
      )
    );

    // 새로운 원자재에서 찾기
    setNewMaterials((prev) =>
      prev.map((mat) =>
        mat.code === code ? { ...mat, quantity: newQuantity } : mat
      )
    );
  };

  // 선택한 원자재들을 제품과 연결
  const handleConnectMaterials = async () => {
    if (selectedMaterials.length === 0 && newMaterials.length === 0) return;

    // 사용 수량 0 검증
    const hasZeroQty =
      selectedMaterials.some((m) => (m.quantity ?? 0) === 0) ||
      newMaterials.some((m) => (m.quantity ?? 0) === 0);
    if (hasZeroQty) {
      setToastText(t('toast.quantityNotEntered.text'));
      setToastSubtext(t('toast.quantityNotEntered.subtext'));
      showToast();
      return;
    }

    // 제품 생성 모드일 때: productId가 없으면 서버 호출 대신 상위로 전달하여 임시 반영
    if (!productId) {
      const staged: Array<{
        id: number;
        name: string;
        code: string;
        spec: string;
        unit: string;
        quantityUnit?: string;
        quantity: number;
      }> = [];

      // 1) 기존 선택 원자재는 그대로 포함 (이미 id 보유)
      if (selectedMaterials.length > 0) {
        staged.push(
          ...selectedMaterials
            .filter((m) => typeof m.id === 'number')
            .map((m) => ({
              id: m.id as number,
              name: m.name,
              code: m.code,
              spec: m.spec,
              unit: m.unit,
              quantityUnit: selectedQuantityUnits[m.code] || m.unit,
              quantity: m.quantity ?? 0,
            }))
        );
      }

      // 2) 수동 추가 원자재는 먼저 생성하여 id 확보
      if (newMaterials.length > 0) {
        if (!factoryId) {
          setToastText(t('toast.factoryNotFound'));
          setToastSubtext('');
          showToast();
          return;
        }

        const createPayload = newMaterials.map((material) => ({
          name: material.name,
          code: material.code,
          spec: material.spec,
          unit: material.unit,
          tax_type: material.tax_type ?? 'taxable',
        }));

        const createResult = await createMaterial(createPayload);
        if (!createResult.success) {
          setToastText(t('toast.createFailed'));
          setToastSubtext(createResult.error || '');
          showToast();
          return;
        }
        const createdMaterialIds = createResult.data?.material_ids;
        if (!createdMaterialIds || createdMaterialIds.length === 0) {
          setToastText(t('toast.cannotGetId'));
          setToastSubtext('');
          showToast();
          return;
        }

        createdMaterialIds.forEach((id: number, index: number) => {
          const src = newMaterials[index] as MaterialItemModel;
          staged.push({
            id,
            name: src.name,
            code: src.code,
            spec: src.spec,
            unit: src.unit,
            quantityUnit: src.unit,
            quantity: src.quantity ?? 0,
          });
        });
      }

      onStage?.(staged);
      onClose();
      return;
    }

    try {
      const allMaterialIds: { id: number; quantity: number; unit: string }[] =
        [];

      // 1. 새로운 원자재 생성
      if (newMaterials.length > 0) {
        if (!factoryId) {
          setToastText(t('toast.factoryNotFound'));
          setToastSubtext('');
          showToast();
          return;
        }

        // 새로운 원자재들을 먼저 생성
        const createPayload = newMaterials.map((material) => ({
          name: material.name,
          code: material.code,
          spec: material.spec,
          unit: material.unit,
          tax_type: material.tax_type ?? 'taxable',
        }));

        const createResult = await createMaterial(createPayload);
        if (!createResult.success) {
          setToastText(t('toast.createFailed'));
          setToastSubtext(createResult.error || '');
          showToast();
          return;
        }

        // 생성된 원자재 ID들을 가져와서 연결 목록에 추가
        const createdMaterialIds = createResult.data?.material_ids;
        if (!createdMaterialIds || createdMaterialIds.length === 0) {
          setToastText(t('toast.cannotGetId'));
          setToastSubtext('');
          showToast();
          return;
        }

        // 생성된 원자재들을 연결 목록에 추가
        allMaterialIds.push(
          ...createdMaterialIds.map((materialId: number, index: number) => ({
            id: materialId,
            quantity: (newMaterials[index] as MaterialItemModel)?.quantity || 0,
            unit: (newMaterials[index] as MaterialItemModel)?.unit || '',
          }))
        );
      }

      // 2. 기존 원자재 ID들을 연결 목록에 추가
      if (selectedMaterials.length > 0) {
        const existingMaterialIds = selectedMaterials.map((material) => ({
          id: material.id || 0,
          quantity: material.quantity || 0,
          unit: selectedQuantityUnits[material.code] || material.unit,
        }));
        allMaterialIds.push(...existingMaterialIds);
      }

      // 3. 모든 원자재를 한 번에 제품에 연결
      if (allMaterialIds.length > 0) {
        const connectPayload = {
          type: 'product' as const,
          target_id: productId,
          connections: allMaterialIds,
        };

        const connectResult = await createMaterialProduct(connectPayload);
        if (!connectResult.success) {
          setToastText(t('toast.connectFailed'));
          setToastSubtext(connectResult.error || '');
          showToast();
          return;
        }
      }

      onClose();
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      setToastText(t('toast.connectError'));
      setToastSubtext(error instanceof Error ? error.message : String(error));
      showToast();
    }
  };

  return (
    <Modal
      title={t('title')}
      subtitle={t('subtitle')}
      width="w-[600px]"
      onClose={onClose}
      scroll={true}
    >
      <div>
        <div className="my-4 flex gap-2.5 px-6">
          <div className="relative flex-1">
            <SearchInput
              placeholder={t('searchPlaceholder')}
              width="w-full"
              value={input}
              onChange={(value) => {
                setInput(value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
            />
            {isDropdownOpen && (
              <div className="absolute left-0 top-14 z-10 w-full">
                <MaterialNameDropdown
                  searchTerm={input}
                  onSelect={handleSelectMaterial}
                  onClose={() => {
                    setIsDropdownOpen(false);
                    setInput('');
                  }}
                  width="w-full"
                />
              </div>
            )}
          </div>
          <MiniBtn
            variant="outline"
            text={tStock('manualAddButton')}
            height="h-12"
            onClick={() => setIsManualAddMode(true)}
          />
        </div>

        <div className="flex flex-col px-6 pb-6 max-h-[calc(85vh-181px)] overflow-y-auto">
          {/* 직접 추가 모드 */}
          {isManualAddMode ? (
            <ManualAddMaterial
              setIsManualAddMode={setIsManualAddMode}
              setNewMaterials={setNewMaterials}
              checkDuplicateMaterialCode={async (code: string) =>
                await checkDuplicateMaterialCode(
                  code,
                  selectedMaterials,
                  newMaterials
                )
              }
              showToast={(text: string, subtext: string) => {
                setToastText(text);
                setToastSubtext(subtext);
                showToast();
              }}
              usageQuantity={true}
            />
          ) : (
            // 선택한 원자재 list
            (selectedMaterials.length > 0 || newMaterials.length > 0) && (
              <div className="flex flex-col gap-3 mb-4">
                {/* 기존 원자재 */}
                {selectedMaterials.map((mat: MaterialItemModel) => (
                  <ConnetionItem
                    key={mat.code}
                    name={mat.name}
                    unit={mat.unit}
                    unitOptions={
                      typeof mat.id === 'number'
                        ? conversionUnits[mat.id] || [mat.unit]
                        : [mat.unit]
                    }
                    selectedUnit={selectedQuantityUnits[mat.code] || mat.unit}
                    onUnitChange={(unit) =>
                      setSelectedQuantityUnits((prev) => ({
                        ...prev,
                        [mat.code]: unit,
                      }))
                    }
                    quantity={mat.quantity || 0}
                    onDelete={() => handleRemoveMaterial(mat.code)}
                    onQuantityChange={(newQuantity: number) =>
                      handleMaterialQuantityChange(mat.code, newQuantity)
                    }
                  />
                ))}

                {/* 새로운 원자재 */}
                {newMaterials.map((mat: MaterialItemModel) => (
                  <ConnetionItem
                    key={mat.code}
                    name={mat.name}
                    unit={mat.unit}
                    quantity={mat.quantity || 0}
                    onDelete={() => handleRemoveNewMaterial(mat.code)}
                    onQuantityChange={(newQuantity: number) =>
                      handleMaterialQuantityChange(mat.code, newQuantity)
                    }
                  />
                ))}
              </div>
            )
          )}

          <div className="flex gap-2.5 justify-end">
            <MiniBtn
              variant="white"
              text={tCommon('cancel')}
              onClick={onClose}
            />
            <MiniBtn
              variant="secondary"
              text={tCommon('add')}
              disabled={
                (selectedMaterials.length === 0 && newMaterials.length === 0) ||
                isManualAddMode ||
                isConnecting ||
                isCreating
              }
              onClick={handleConnectMaterials}
            />
          </div>
        </div>
      </div>

      {/* 토스트 */}
      {isToastOpen && (
        <Toast
          icon={<WarningCircle size={20} className="text-red" />}
          text={toastText}
          subtext={toastSubtext}
          type="red"
          isVisible={isVisible}
        />
      )}
    </Modal>
  );
};

export default ConnectMaterialModal;
