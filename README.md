# wowBoard

카카오 Oven과 유사한, 브라우저에서 화면 기획서/와이어프레임을 만드는 웹 솔루션.
소셜 로그인 → 프로젝트 생성 → 화면에 컴포넌트를 드래그 배치 → 읽기전용 링크로 공유.

## 구성 (npm workspaces 모노레포)

| 위치 | 내용 |
| --- | --- |
| `apps/web` | React + Vite + TypeScript SPA (에디터/대시보드/공유 뷰어) |
| `apps/api` | NestJS + Prisma 백엔드 (소셜 인증·프로젝트·화면·공유 API) |
| `packages/shared` | 프론트·백엔드 공유 타입 + 컴포넌트 팔레트 정의 |

- **DB**: PostgreSQL (Docker, 호스트 포트 **7432**)
- **웹 dev 포트**: **7100** / **API 포트**: **7000**
  (이 환경에서 5432·5433·5173 등이 이미 사용 중이라 충돌을 피해 지정함)
- **캔버스**: 절대좌표 자유 배치(react-rnd) — Oven 스타일

## 빠른 시작

```bash
# 1) 의존성
npm install

# 2) DB 기동 (PostgreSQL on :7432)
npm run db:up

# 3) 환경변수: 루트 .env.example 참고. apps/api/.env 가 dev 기본값으로 들어있음.
#    실제 소셜 로그인을 쓰려면 각 provider의 CLIENT_ID/SECRET 채우기.

# 4) 마이그레이션 (최초 1회) + Prisma client 생성
npm run prisma:migrate

# 5) 개발 서버 (api + web 동시)
npm run dev
# web:  http://localhost:7100
# api:  http://localhost:7000
```

## 소셜 로그인 설정

각 개발자 콘솔에서 OAuth 앱을 만들고 콜백 URL을 등록한 뒤 `apps/api/.env`에 키를 채웁니다.
키가 비어 있는 provider는 로그인 시도 시 실패하므로, **Google → Kakao → Naver → Apple** 순서로 활성화하길 권장합니다.

| Provider | 콘솔 | 콜백 URL |
| --- | --- | --- |
| Google | console.cloud.google.com | `http://localhost:7000/auth/google/callback` |
| Kakao | developers.kakao.com | `http://localhost:7000/auth/kakao/callback` |
| Naver | developers.naver.com | `http://localhost:7000/auth/naver/callback` |
| Apple | developer.apple.com (유료) | `http://localhost:7000/auth/apple/callback` |

> Apple은 유료 개발자 계정과 `.p8` 키가 필요합니다. `APPLE_PRIVATE_KEY_PATH`에 키 파일 경로를 지정하세요.

## API 개요

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/auth/:provider` | 소셜 로그인 시작 (google/kakao/naver/apple) |
| GET/POST | `/auth/:provider/callback` | 콜백 → JWT 쿠키 발급 후 web으로 리다이렉트 |
| GET | `/auth/me` | 현재 사용자 |
| POST | `/auth/logout` | 로그아웃 |
| GET/POST | `/projects`, `/projects/:id` … | 프로젝트 CRUD (소유권 가드) |
| POST | `/projects/:id/screens` | 화면 추가 |
| PUT | `/screens/:id/elements` | 화면 요소 일괄 저장 (에디터 자동저장) |
| POST/DELETE | `/projects/:id/share` | 공유 토큰 발급/회수 |
| GET | `/share/:token` | **인증 없이** 읽기전용 조회 |

## MVP 범위

로그인 · 프로젝트 CRUD · 화면 에디터(드래그/리사이즈) · 컴포넌트 팔레트 · 읽기전용 공유.
범위 밖(후속): 실시간 협업, 댓글, 화면 전환 링크(프로토타이핑), 이미지 업로드, 버전 히스토리.
