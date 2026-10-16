# Decisions

STEP마다 한 줄. `날짜 · STEP · 결정 · 근거`

| 날짜 | STEP | 결정 | 근거 |
|---|---|---|---|
| 2026-10-16 | 0-setup | 레포 구조 세팅(CLAUDE.md 루트, docs/, `_ref/` gitignore) | BuildPlay_Book §0 |
| 2026-10-16 | 0 | 스택 확정(_ref 버전 + lowdb 7 · pdf-parse 1.1.1 · cheerio 1 · zod 4 · vitest), Node 22 LTS(.nvmrc) | Node 25 전역 localStorage 리스크 |
| 2026-10-16 | 0 | Ollama: OLLAMA_MODEL=qwen3:8b(think:false) · OLLAMA_VISION_MODEL=gemma3:4b | 18GB 메모리, pure-app 실측 7~10s |
| 2026-10-16 | 0 | sim 이식: state-motion·exporters·LeLamp 스펙 버림, robots는 pure-desk만(리타겟 유지), viewer3d 스테이지 색 옵션화 | 새 설계는 시그니처+레시피, 디자인 패스에서 sim 수정 불가 |
| 2026-10-16 | 0 | 한계 정책: 레시피 진폭은 validateRecipe가 리그 범위 안으로 선클램프, limitExceeded 모달은 구조 범위(Edit limits·타임라인 입력) 초과 시만 | 진폭 1.04↑ focus head_tilt 초과(pure-app 측정) |
| 2026-10-16 | 0 | 부록 D 🟡 전부 추천대로. 가이드라인 라우트 [[...slug]]. STEP10② 확인값 shoulder_pitch −20~40 | 리그 범위 −35~55 |
| 2026-10-16 | 1 | 스캐폴드 + /dev. 구현 표시는 page.tsx 첫 줄 `// @implemented`(화면 ID는 `// @screen`)로 변경, 데모 모드는 쿠키 `pure_demo` | `export const implemented`는 next build 타입 검사 실패("not a valid Page export field") |
| 2026-10-16 | 2 | sim 이식: SimRuntime(React 없는 재생 루프)로 Provider 대체, 범위 감지는 runtime이 setPose 직전, 얼굴 파라미터에 eyeOpen 추가, 프리셋은 data/face-presets.ts, TimelineEditor는 W02E로 미룸 | exporters·useLeLamp 의존 제거, STEP 3 SimController가 감쌀 단일 런타임 |
| 2026-10-16 | 3 | SimController 계약 + Viewport, sim 봉인. 재생 시계 분리(speed는 시계, 물리는 실시간), 레시피는 SequencePlayer, 한계 초과 시 일시정지(HOME·idle 제외, 새 재생은 범위 내로 클램프한 자세에서 시작), Sound는 SoundEngine 주입, FaceSpec.tokens.eyeOpen 선택 필드 추가, 계약 추가 메서드 projectJoints·resize·isPaused·setStopOnLimit·getParams·debugCommand | 봉인 후 STEP 9·10이 sim 내부를 건드리지 않도록 |
| 2026-10-16 | 4 | models는 zod 스키마에서 타입 추론, data/ 콘텐츠·시드·가이드라인(7섹션 67항목, placeholder 0) 작성. UI 문구는 PRD 기반 임시(설계서 WC 표 없음, 디자인 패스에서 Figma로 교체), 팀원 3명 이름 임시 | 스키마·타입 불일치 방지, 시연 경로 콘텐츠 확보 |
| 2026-10-16 | 5 | lowdb repo(시계·어댑터 주입, 쓰기 직렬화, 첫 실행 시드) + API 28개 + 잡(레지스트리, 재시작 시 현재 step부터 재개). 업로드는 원본 스트리밍 PUT, 데모 모드는 DB settings. Share는 passwordHash·lockedUntil·createdAt, Job·Settings 모델 추가 | 500MB 업로드 메모리 문제, 전시 PC 한 대 기준 단일 설정 |
| 2026-10-16 | 6 | lib/llm: OllamaClient(/api/chat, format=zod toJSONSchema, think:false, keep_alive 10m, 60s/20s) + 재시도 1회 → 데모 폴백(취소는 전달). 레퍼런스는 2단계(gemma3:4b 요약 → qwen3:8b 생성). 실측 생성 16~28s·비전 9s, name 밑줄·repeat 범위 밖·reasoning 1인칭은 STEP 8 검증/STEP 11 튜닝에서 | qwen3 텍스트 전용, pure-app 결정(예문 금지) 계승 |
| 2026-10-16 | 7 | lib/signature: PDF(pdf-parse 페이지별 + BaseFont·본문 Typeface + Flate 스트림 rg 색), URL(cheerio + CSS 3개), Figma·텍스트 없음은 E1(Job.errorCode). 톤→축은 사전 합산, How it maps는 같은 방향 최대 기여 키워드. 데모 PDF는 scripts/make-brand-guide.mjs로 생성(public/demo, warm p.4·playful p.7·precise p.12) | 브랜드 PDF 부재, pdf.js 1.10 호환 위해 object stream 끔 |
