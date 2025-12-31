'use client';

import { useState, useEffect } from 'react';
import Dropdown from '@/ui/dropdown/dropdown';
import DropdownItem from '@/ui/dropdown/dropdown-item';
import useAuthStore from '@/store/auth-store';
import { useMe } from '@/hooks';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useToast } from '@/hooks';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react';

// 언어 정보 타입
interface LanguageInfoModel {
  code: string;
  nativeName: string;
  flag: string;
}

// 지원하는 언어 목록 (확장 가능)
const AVAILABLE_LANGUAGES: LanguageInfoModel[] = [
  { code: 'ko', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'en', nativeName: 'English', flag: '🇺🇸' },
  // 나중에 추가할 수 있는 언어들 (주석 처리)
  // { code: 'ja', nativeName: '日本語', flag: '🇯🇵' },
  // { code: 'zh', nativeName: '中文', flag: '🇨🇳' },
];

const LanguageSetting = () => {
  const { userInfo } = useAuthStore();
  const { updateMe } = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const { isToastOpen, isVisible, showToast } = useToast();

  // userInfo에서 language를 가져와서 해당하는 LanguageInfoModel 찾기
  const getLanguageFromUserInfo = (
    languageCode?: string | null
  ): LanguageInfoModel => {
    if (languageCode) {
      // languageCode가 'korean' 또는 'english'인 경우 코드로 변환
      const codeMap: Record<string, string> = {
        korean: 'ko',
        english: 'en',
      };
      const mappedCode = codeMap[languageCode] || languageCode;

      const found = AVAILABLE_LANGUAGES.find(
        (lang) => lang.code === mappedCode
      );
      if (found) return found;
    }
    // 기본값: 한국어
    return AVAILABLE_LANGUAGES[0];
  };

  const [selectedLanguage, setSelectedLanguage] = useState<LanguageInfoModel>(
    () => getLanguageFromUserInfo(userInfo?.language)
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // userInfo가 변경되면 selectedLanguage 업데이트
  useEffect(() => {
    setSelectedLanguage(getLanguageFromUserInfo(userInfo?.language));
  }, [userInfo?.language]);

  const handleLanguageSelect = async (language: LanguageInfoModel) => {
    // 언어 코드를 백엔드 형식으로 변환 (ko -> 'korean', en -> 'english')
    const languageMap: Record<string, string> = {
      ko: 'korean',
      en: 'english',
    };
    const backendLanguage = languageMap[language.code] || language.code;

    // 백엔드에 언어 변경 요청
    const result = await updateMe({ language: backendLanguage });

    if (result.success) {
      setSelectedLanguage(language);
      setIsDropdownOpen(false);

      // locale 변경 (URL이 자동으로 변경됨)
      router.replace(pathname, { locale: language.code });
    } else {
      // 에러 처리 - 토스트 메시지 표시
      console.error('언어 변경 실패:', result.error);
      showToast();
    }
  };

  return (
    <div className="flex flex-col py-8 gap-4 border-b border-b-[#eeeeee]">
      <h3 className="Heading-3">언어 설정</h3>
      <div className="flex flex-col gap-2">
        <p className="Me_Body-1 text-sv">언어 선택</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full max-w-[300px] h-12 px-4 border border-lg rounded-lg bg-white hover:bg-bg transition-colors duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedLanguage.flag}</span>
              <span className="Heading-4 text-dg">
                {selectedLanguage.nativeName}
              </span>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`text-sv transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 z-10 mt-2">
              <Dropdown
                onClose={() => setIsDropdownOpen(false)}
                width="w-[300px]"
              >
                {AVAILABLE_LANGUAGES.map((language) => {
                  const isSelected = selectedLanguage.code === language.code;
                  return (
                    <DropdownItem
                      key={language.code}
                      onClick={() => handleLanguageSelect(language)}
                      textColor={isSelected ? 'text-primary' : 'text-dg'}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-xl">{language.flag}</span>
                        <span className="Heading-4">{language.nativeName}</span>
                        {isSelected && (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="ml-auto text-primary"
                          >
                            <path
                              d="M16.6667 5L7.50004 14.1667L3.33337 10"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    </DropdownItem>
                  );
                })}
              </Dropdown>
            </div>
          )}
        </div>
      </div>

      {/* 에러 토스트 */}
      {isToastOpen && (
        <Toast
          icon={<WarningCircle size={20} className="text-red" />}
          text="언어 변경에 실패했습니다"
          subtext="잠시 후 다시 시도해주세요."
          type="red"
          isVisible={isVisible}
        />
      )}
    </div>
  );
};

export default LanguageSetting;
