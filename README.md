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

### DevOps

- **Docker & Docker Compose** - 컨테이너화
- **Nginx** - 리버스 프록시 및 정적 파일 서빙
- **Railway** - 클라우드 배포 플랫폼

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

## 🚀 개발 환경 설정

### 필수 요구사항

- Docker & Docker Compose
- Node.js 18+ (로컬 개발시)
- Python 3.9+ (로컬 개발시)

### 환경변수 설정

#### Backend (.env)

```env
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_HOST=redis
REDIS_PASSWORD=redis-password
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
BAROBILL_CERT_KEY=your-barobill-cert
TOSS_PAYMENTS_SECRET_KEY=your-toss-secret
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Docker로 실행

```bash
# 전체 서비스 실행
make up

# 빌드와 함께 실행
make build

# 마이그레이션
make migrate

# 테스트 실행
make test
```

### 로컬 개발

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## 🐳 Docker 구성

### 서비스 구성

- **Frontend**: Next.js 개발 서버 (포트 3000)
- **Backend**: Django + Gunicorn (포트 8000)
- **Redis**: 캐시 및 WebSocket 채널 레이어 (포트 6379)
- **Nginx**: 리버스 프록시 (포트 80)

### 네트워크

모든 서비스는 `network`라는 공통 네트워크에서 통신합니다.

## 📊 데이터베이스 구조

### 주요 모델 관계

```
User ──────→ Factory ──────→ Project
  │             │              │
  └─→ FactoryMember    ├─→ Equipment    ├─→ Quotation
                       └─→ Client       └─→ ProjectPlan

Material ←─────→ Product
    │               │
    └─→ MaterialHistory  └─→ ProductHistory
```

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

## 🧪 테스트

### Backend 테스트

```bash
# 전체 테스트
make test

# 특정 앱 테스트
make testapp user

# 특정 파일 테스트
make testfile user test_models
```

### Frontend 테스트

```bash
cd frontend
npm run lint
```

## 🚀 배포

### Railway 배포

- `django_railway.toml` 설정으로 자동 배포
- `nextjs_railway.toml` 설정으로 프론트엔드 배포

### Docker 배포

```bash
docker-compose up -d
```

## 🎨 UI 컴포넌트

### 주요 컴포넌트

- **SideBar**: 메인 네비게이션
- **SearchDeleteTable**: 검색 및 삭제 기능
- **Pagination**: 페이지네이션
- **DocumentTable**: 문서 목록 테이블
- **MainTitleSec**: 페이지 제목 섹션

### 레이아웃 구조

- `(with-layout)`: 사이드바 포함 레이아웃
- `(without-layout)`: 로그인, 온보딩 등 사이드바 없는 페이지

## 📈 확장성 고려사항

### 아키텍처 특징

1. **모듈형 설계**: 기능별로 분리된 Django 앱
2. **비동기 지원**: Django Ninja를 통한 async/await 패턴
3. **실시간 통신**: WebSocket을 통한 실시간 알림
4. **외부 연동**: 다양한 외부 서비스와의 API 연동
5. **확장성**: Redis 캐시 및 채널 레이어를 통한 확장성

### 성능 최적화

- Redis 캐시 활용
- CDN을 통한 정적 파일 서빙
- Next.js Turbopack 빌드 최적화
- DB 쿼리 최적화

## 🤝 기여 가이드

### 개발 워크플로우

1. 기능 브랜치 생성
2. 코드 작성 및 테스트
3. 린트 검사 통과
4. PR 생성 및 리뷰

### 코딩 스타일

- **Backend**: Django 코딩 스타일 가이드
- **Frontend**: ESLint + Prettier 설정 준수
- **TypeScript**: 엄격한 타입 체크

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**Factory X** - 제조업체의 디지털 혁신을 위한 종합 관리 플랫폼
