# i18next-scanner 사용 가이드

이 프로젝트는 `i18next-scanner`를 사용하여 코드에서 번역 키를 자동으로 추출하고 번역 파일을 업데이트합니다.

## 설치

이미 설치되어 있습니다:

```bash
npm install --save-dev i18next-scanner
```

## 사용 방법

### 1. 번역 키 스캔 및 추출

프로젝트의 모든 파일을 스캔하여 번역 키를 추출하고 번역 파일을 업데이트합니다:

```bash
npm run i18n:scan
```

이 명령은 다음을 수행합니다:

- `src/` 디렉토리의 모든 `.js`, `.jsx`, `.ts`, `.tsx` 파일을 스캔
- `t('key')` 형태의 번역 키를 찾아서 추출
- `src/messages/ko.json`과 `src/messages/en.json`에 자동으로 추가

### 2. next-intl과 함께 사용하기

`next-intl`의 `useTranslations` 훅을 사용할 때:

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function MyComponent() {
  // 네임스페이스 없이 사용
  const t = useTranslations();

  return (
    <div>
      <button>{t('common.save')}</button>
      <button>{t('common.cancel')}</button>
    </div>
  );
}
```

또는 네임스페이스를 지정:

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('common');

  return (
    <div>
      <button>{t('save')}</button>
      <button>{t('cancel')}</button>
    </div>
  );
}
```

### 3. 스캔 결과

스캔 후 `src/messages/ko.json`과 `src/messages/en.json` 파일이 자동으로 업데이트됩니다:

```json
{
  "common": {
    "save": "저장",
    "cancel": "취소",
    "newKey": "__STRING_NOT_TRANSLATED__" // 새로 발견된 키
  }
}
```

번역되지 않은 키는 `__STRING_NOT_TRANSLATED__`로 표시되므로, 이를 실제 번역으로 교체해야 합니다.

## 설정 파일

설정은 `i18next-scanner.config.js` 파일에서 관리됩니다:

- **input**: 스캔할 파일 경로
- **lngs**: 지원하는 언어 목록 (`['ko', 'en']`)
- **resource.loadPath/savePath**: 번역 파일 경로
- **keySeparator**: 키 구분자 (`.`)

## 주의사항

1. **기존 번역 보존**: 스캐너는 기존 번역을 덮어쓰지 않고, 새로운 키만 추가합니다.
2. **수동 번역 필요**: 스캔 후 `__STRING_NOT_TRANSLATED__`로 표시된 키는 수동으로 번역해야 합니다.
3. **네임스페이스**: 점(`.`)으로 구분된 키는 자동으로 중첩 객체로 변환됩니다.
   - `t('common.save')` → `{ "common": { "save": "..." } }`

## 예시

코드에서:

```tsx
const t = useTranslations();
return <div>{t('dashboard.welcome')}</div>;
```

스캔 후 `messages/ko.json`:

```json
{
  "dashboard": {
    "welcome": "__STRING_NOT_TRANSLATED__"
  }
}
```

수동으로 번역 추가:

```json
{
  "dashboard": {
    "welcome": "환영합니다"
  }
}
```
