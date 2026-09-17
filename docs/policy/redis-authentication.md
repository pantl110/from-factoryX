# Redis 인증 환경별 정책

## 목적

Redis 비밀번호 설정이 누락됐을 때 스테이징·운영 서버가 무인증 Redis에 접속한 채 시작되는 것을 방지한다.

## 환경별 규칙

| `DJANGO_ENV_NAME` | `REDIS_PASSWORD` 없음 | `REDIS_PASSWORD` 있음 |
| --- | --- | --- |
| `local` | 비밀번호 없는 접속 허용 | 비밀번호를 사용해 접속 |
| `test` | 비밀번호 없는 접속 허용 | 비밀번호를 사용해 접속 |
| `staging` | 설정 오류로 서버 시작 중단 | 비밀번호를 사용해 접속 |
| `production` | 설정 오류로 서버 시작 중단 | 비밀번호를 사용해 접속 |

`DJANGO_ENV_NAME`이 누락되거나 위 네 가지 외의 값이면 설정 오류로 서버 시작을 중단한다.

## 환경변수 예시

로컬 개발 환경:

```env
DJANGO_ENV_NAME=local
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

스테이징·운영 환경:

```env
DJANGO_ENV_NAME=staging
REDIS_HOST=<redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<secret-manager에 보관한 비밀번호>
```

운영에서는 `DJANGO_ENV_NAME=production`을 사용한다. 실제 비밀번호는 저장소나 문서에 기록하지 않고 배포 환경의 Secret 관리 기능에서 주입한다.

## 배포 순서

1. 배포 환경에 `DJANGO_ENV_NAME`을 설정한다.
2. `staging` 또는 `production`이면 `REDIS_PASSWORD`를 Secret으로 설정한다.
3. 서버를 배포한다.
4. Django 캐시 저장·조회와 API Rate Limit 응답을 확인한다.

`staging` 또는 `production`에서 `REDIS_PASSWORD`가 누락되면 서버는 실행되지 않으며, 이는 무인증 Redis 사용을 방지하기 위한 의도된 동작이다.
