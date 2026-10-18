# PURE Web — 개발 규칙

코드 주석의 "rule N"은 아래 번호를 가리킨다.

## 스택
Next.js 15 App Router · React 19 · TypeScript · Tailwind v4 · three / r3f / drei · lowdb(`data/db.json`) · zod.
시뮬레이터는 `lib/sim` + `components/sim`(MuJoCo wasm, `public/mujoco`). LLM은 로컬 Ollama(`/api/chat`, JSON schema).
비주얼 값은 Figma Dev Mode 변수·디자인 컨텍스트를 토큰 기반 컴포넌트로 옮긴다.

## 규칙
1. 요청 범위만 바꾼다. 다른 화면·파일을 미리 만들지 않는다.
2. 디자인 단계에서는 `lib/`, `data/`, `app/api/`, `components/sim`을 바꾸지 않는다. 페이지 마크업·`components/ui`·`styles`만.
3. 시뮬 봉인: `lib/sim`, `components/sim` 내부는 바꾸지 않는다. 계약은 `components/sim/sim-controller.ts` 하나.
4. 로직 단계는 회색 박스로 동작만 만든다.
5. 큰 단계는 코드 전에 계획부터.
6. 단계마다 확인할 URL · 클릭 순서 · 보여야 하는 것을 적고, `/dev` 체크리스트(page.tsx 첫 줄 `// @implemented`)를 갱신한다.
7. 한 번에 하나. 확인 → 커밋 → `docs/decisions.md` 한 줄.
8. 픽셀·색·간격은 Figma Dev Mode 값 그대로. 스크린샷으로 추정하지 않는다.
9. 콘텐츠(타입·문장·칩·패턴·프리셋·시드·데모 레시피·가이드라인 본문)는 `data/`에. 하드코딩하지 않는다. UI 문구는 영어.
10. 색·타이포·간격은 토큰 CSS 변수. 컴포넌트에 hex를 쓰지 않는다.
11. LLM 출력은 반드시 `lib/expression` 검증(허용 목록·범위 클램프·각속도)을 거친다. 실패나 Ollama 없음은 항상 데모 폴백.
12. 분석·추출·생성은 jobId 잡. 화면을 나가도 계속되고 다시 들어오면 복구된다.
13. 실험 기능(directClip)은 플래그 아래, 기본 off. off일 때 기존 테스트가 모두 통과해야 한다.
14. 페이지당 Viewport 인스턴스 1개(wasm 10MB). 카드 썸네일은 캡처 PNG.
15. 업로드 파일·프레임은 `data/uploads/` 밖으로 나가지 않는다(로컬 Ollama 전송 제외).
16. 라이트 모드만, 데스크톱 1920 기준.
