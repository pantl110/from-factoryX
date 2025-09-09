# Factory X - 제조업체 종합 관리 시스템

## 📋 프로젝트 개요

Factory X는 제조업체를 위한 종합 공장 관리 시스템입니다. 공장 운영, 프로젝트 관리, 재고 관리, 세금계산서 발행, 구독 결제 등의 기능을 제공하는 풀스택 웹 애플리케이션입니다.

## 🏗 프로젝트 구조

```
factory_x/
├── frontend/          # Next.js 프론트엔드
├── backend/           # Django 백엔드 API
├── nginx/             # Nginx 설정
├── docker-compose.yml # Docker 컨테이너 구성
├── Makefile          # 개발 편의 명령어
└── README.md         # 프로젝트 문서
```

## 🛠 기술 스택

### Frontend (Next.js)

- **Next.js 15.3.3** - React 기반 풀스택 프레임워크
- **React 19.0.0** - 사용자 인터페이스 라이브러리
- **TypeScript 5** - 정적 타입 검사
- **Tailwind CSS 4** - 유틸리티 우선 CSS 프레임워크
- **Phosphor Icons** - 아이콘 라이브러리
- **Pretendard Font** - 한국어 최적화 폰트

### Backend (Django)

- **Django 5.0.10** - 메인 웹 프레임워크
- **Django Ninja 1.3.0** - REST API 프레임워크 (FastAPI 스타일)
- **PostgreSQL/SQLite** - 데이터베이스
- **Redis** - 캐시 및 세션 저장소
- **Django Channels** - WebSocket 실시간 통신
- **JWT** - 토큰 기반 인증

### 외부 서비스 연동

- **AWS S3/SES** - 파일 저장 및 이메일 서비스
- **바로빌 API** - 세금계산서/현금영수증 발행
- **토스페이먼츠** - 구독 결제 시스템
- **LangChain + OpenAI** - AI 기반 문서 처리

## 🎯 주요 기능

### 🏭 공장 관리

- 공장 정보 등록 및 관리
- 생산 설비 관리 (우선순위 기반 자동 배정)
- 거래처 관리 (수주처/발주처)
- 팩토리 멤버 초대 및 권한 관리

### 📊 프로젝트 관리

- 프로젝트 생명주기 관리 (견적→확정→생산→완료)
- 생산 계획 및 설비 배정
- 생산 로그 및 이력 관리
- 반품 처리

### 📦 재고 관리

- 자재 및 제품 재고 관리
- 재고 입출고 히스토리 추적
- 자재-제품 연결 관리
- 재고 부족 알림

### 📄 문서 관리

- 견적서/주문서 생성 및 관리
- OCR을 통한 문서 자동 인식
- 납기일 관리 및 알림

### 💰 세무 관리

- 세금계산서 발행 및 관리
- 현금영수증 발행
- 바로빌 연동을 통한 자동 발행

### 🔔 실시간 알림

- WebSocket 기반 실시간 알림
- 납기일 임박, 재고 부족 등 자동 알림
- 알림 유형별 분류 (경고/정보/완료)

### 💳 구독 결제

- 토스페이먼츠 연동 구독 결제
- 빌링키 발급 및 자동 갱신
- 결제 내역 관리

## 🖥 사용자 인터페이스

### 주요 페이지

- **대시보드** - 전체 현황 요약
- **프로젝트 관리** - 진행/완료 프로젝트 조회
- **재고 관리** - 자재/제품 재고 현황
- **세무/회계** - 세금계산서 및 현금영수증
- **문서함** - 견적서, 주문서, 거래명세서
- **설정** - 공장 설정 및 멤버 관리

### UI/UX 특징

- 반응형 디자인 (모바일/태블릿/데스크톱)
- 직관적인 사이드바 네비게이션
- 실시간 알림 시스템
- 모던한 한국어 타이포그래피 (Pretendard)

### 상태 관리

- **프로젝트**: 견적협의 → 주문확정 → 생산대기 → 생산중 → 생산완료 → 납품 → 완료
- **생산계획**: 가동대기 → 가동중 → 가동완료 → 가동불가
- **설비**: 가동대기 → 가동중

## 🔐 보안 및 인증

### JWT 토큰 기반 인증

- Access Token: 1년 만료
- Refresh Token: 2년 만료
- 이메일 기반 사용자 식별

### CORS 설정

- API 엔드포인트: `/v1/*`
- 크레덴셜 포함 요청 허용

## 📡 API 문서

### Django Ninja 자동 생성 문서

- **URL**: `http://localhost:8000/docs/`
- **제목**: "Factory X API"
- **버전**: "0.1.0"

### 주요 API 엔드포인트

```
/v1/auth/*           # 사용자 인증
/v1/factory/*        # 공장 관리
/v1/project/*        # 프로젝트 관리
/v1/stock/*          # 재고 관리
/v1/document/*       # 문서 관리
/v1/tax/*            # 세무 관리
/v1/notification/*   # 알림 관리
/v1/subscription/*   # 구독 결제
/v1/barobill/*       # 바로빌 연동
/v1/aws/*            # AWS 서비스
```

### WebSocket 엔드포인트

```
/ws/notification/{factory_id}/  # 실시간 알림
```

## ⚙️ 정기 작업 (Cron)

### 자동화된 작업들

```python
# 매일 오전 9시: 프로덕션 상태 업데이트
"0 9 * * *" → update_production_status

# 매일 오전 6시: 구독 자동 갱신 (1일 후 만료)
"0 6 * * *" → renew_subscriptions --days=1

# 매일 오전 6시 30분: 구독 자동 갱신 (당일 만료)
"30 6 * * *" → renew_subscriptions --days=0
```

## 🎨 Frontend 상세 구조

### 📁 디렉토리 구조

```
frontend/src/
├── app/                    # Next.js App Router
│   ├── (with-layout)/     # 사이드바 포함 레이아웃
│   │   ├── dashboard/     # 대시보드
│   │   ├── project/       # 프로젝트 관리
│   │   ├── stock/         # 재고 관리
│   │   ├── document/      # 문서 관리
│   │   ├── tax/           # 세무 관리
│   │   ├── production/    # 생산 관리
│   │   ├── quotation/     # 견적 관리
│   │   └── setting/       # 설정
│   ├── (without-layout)/  # 레이아웃 없는 페이지
│   │   ├── login/         # 로그인
│   │   └── onboarding/    # 온보딩
│   ├── layout.tsx         # 루트 레이아웃
│   └── globals.css        # 전역 스타일
├── components/            # 재사용 컴포넌트
├── hooks/                 # 커스텀 훅스
├── store/                 # 상태 관리 (Zustand)
├── types/                 # TypeScript 타입 정의
├── ui/                    # UI 컴포넌트
├── utils/                 # 유틸리티 함수
└── mocks/                 # 목업 데이터
```

### 🧩 주요 컴포넌트

#### 레이아웃 컴포넌트

- **SideBar**: 메인 네비게이션 (대시보드, 프로젝트, 재고, 세무, 문서, 설정)
- **TopBar**: 상단 바 (빵부스러기, 알림, 프로필)
- **Layout**: 레이아웃 래퍼 (사이드바 표시/숨김 관리)

#### UI 컴포넌트

- **Input**: 커스텀 입력 필드 (비밀번호 토글, 에러 표시)
- **SearchDeleteTable**: 검색 및 삭제 기능이 있는 테이블
- **Pagination**: 페이지네이션 컴포넌트
- **Panel**: 오버레이 패널 (상세 정보 표시)
- **Modal**: 각종 모달 (삭제 확인, 등록, 수정)
- **Toast**: 알림 메시지
- **Spinner**: 로딩 스피너
- **Checkbox**: 커스텀 체크박스

#### 비즈니스 컴포넌트

- **DocumentTable**: 문서 목록 테이블 (주문서, 견적서, 세금계산서)
- **ProductionPlan**: 생산 계획 관리
- **ProductionMonitor**: 생산 현황 모니터링
- **MaterialEnrollment**: 자재 등록
- **ProductDetail**: 제품 상세 정보

### 🗂 라우팅 구조

#### App Router (Next.js 13+)

```typescript
// 레이아웃이 있는 페이지
/dashboard              # 대시보드
/project/process        # 진행 중인 프로젝트
/project/completed      # 완료된 프로젝트
/production/[id]        # 생산 상세 (동적 라우팅)
/stock?tab=product      # 재고 관리 (쿼리 파라미터)
/stock?tab=material     # 자재 관리
/document               # 문서함
/tax                    # 세무 관리
/quotation              # 견적 관리
/setting                # 설정

// 레이아웃이 없는 페이지
/login                  # 로그인
/onboarding             # 온보딩 (5단계)
```

#### 레이아웃 시스템

- **`(with-layout)`**: 사이드바 + 탑바 포함
- **`(without-layout)`**: 순수 페이지 (로그인, 온보딩)
- **동적 라우팅**: `[id]` 파라미터 사용
- **쿼리 파라미터**: URL 상태 관리

### 🏪 상태 관리 (Zustand)

#### 주요 Store들

```typescript
// 인증 상태
authStore: {
  userInfo: UserInfoModel | null
  isAuthenticated: boolean
  isLoading: boolean
  fetchUserInfo: () => Promise<boolean>
  clearAuth: () => void
}

// 공장 정보
factoryStore: {
  currentFactory: FactoryModel | null
  setCurrentFactory: (factory: FactoryModel) => void
}

// 페이지 상태
pageStatusStore: {
  stockTab: 'product' | 'material'
  productionTab: ProductionTabType
  setStockTab: (tab: StockTabType) => void
}

// 멤버 관리
memberStore: {
  members: FactoryMemberModel[]
  setMembers: (members: FactoryMemberModel[]) => void
}
```

#### 지속성 저장

- **localStorage**: 인증 정보, 사용자 설정
- **sessionStorage**: 임시 데이터
- **쿠키**: JWT 토큰 (HttpOnly)

### 🎣 커스텀 훅스

#### API 훅스 (React Query 패턴)

```typescript
// 인증
useLogin, useSignup, useLogout, useMe;

// 프로젝트
useGetProjects, useCreateProject, useUpdateProjectStatus;

// 재고
useMaterialStatus, useProductHistory, useLocation;

// 문서
useGetQuotation, useGetTaxInvoices;

// 대시보드
useGetDashboard, useGetTodayProductionPlans;
```

#### 유틸리티 훅스

```typescript
useAuthGuard         # 인증 가드
useCheckAll          # 전체 선택/해제
usePagination        # 페이지네이션
useToast            # 토스트 메시지
useDebounce         # 검색어 디바운스
usePortalDropdown   # 포털 드롭다운
```

### 📱 반응형 디자인

#### Tailwind CSS 브레이크포인트

```css
/* 모바일 퍼스트 접근 */
sm:     640px   # 태블릿
md:     768px   # 작은 데스크톱
lg:    1024px   # 데스크톱
xl:    1280px   # 큰 데스크톱
2xl:   1536px   # 매우 큰 화면
```

#### 적응형 레이아웃

- **사이드바**: 모바일에서 숨김/토글
- **테이블**: 가로 스크롤 지원
- **모달**: 화면 크기에 따른 크기 조정
- **폰트**: Pretendard 한국어 최적화

### 🔄 데이터 플로우

#### 상태 업데이트 패턴

```typescript
// 1. API 호출
const { data, isLoading, error } = useGetProjects();

// 2. 로컬 상태 업데이트
const [localState, setLocalState] = useState();

// 3. 글로벌 상태 업데이트
const updateGlobalState = useStore((state) => state.update);

// 4. 낙관적 업데이트
const mutate = useMutation({
  onMutate: () => {
    // 즉시 UI 업데이트
  },
  onError: () => {
    // 롤백
  },
});
```

### 🎯 UX/UI 특징

#### 사용자 경험

- **로딩 상태**: Suspense + Spinner
- **에러 처리**: 토스트 메시지
- **실시간 업데이트**: WebSocket 연결
- **검색**: 디바운스된 실시간 검색
- **필터링**: 드롭다운 필터
- **정렬**: 테이블 헤더 클릭

#### 접근성

- **키보드 네비게이션**: Tab 순서 관리
- **스크린 리더**: ARIA 라벨
- **색상 대비**: WCAG 가이드라인 준수
- **폰트 크기**: 가독성 최적화

```

```
