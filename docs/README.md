# wowBoard 개발 문서

## 작업 워크플로 (모든 작업에 적용)

1. **이슈 생성** — 작업 시작 전 GitHub 이슈를 만든다 (`gh issue create`). 무엇을, 왜 할지 적는다.
2. **작업 계획 기록** — `docs/work-log/<YYYY-MM-DD>.md`(그날 파일)에 할 내용을 먼저 적는다.
3. **개발** — 실제 구현/수정.
4. **결과 기록** — 같은 날짜 파일에 *어떻게 개발했는지 / 어떻게 처리했는지*를 적는다.
5. **이슈 마감** — 이슈에도 처리 내용을 코멘트로 남기고 닫는다 (`gh issue close <N> -c "..."`).

## 폴더

- `work-log/` — 날짜별 작업 일지 (`YYYY-MM-DD.md`).

## 참고

- 시크릿(`.env`, `*.p8`)은 `.gitignore`로 제외되어 커밋/푸시되지 않는다.
- 접속 URL: dev `http://dev.brainsp.com:7100`, prod `https://wowboard.oopnwow.com`.
