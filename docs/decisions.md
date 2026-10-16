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
| 2026-10-16 | 8 | **sim 계약 변경(승인)**: lib/sim/motion.ts MotionPlayer — 키프레임 1개 반복 동작(focus·sleep)이 사이클마다 startPose로 튀던 버그 수정(prev = 마지막 키프레임). 회귀 테스트 추가 | _ref 원본 버그, 재생 중 head_tilt 35° 순간 이동 |
| 2026-10-16 | 8 | lib/expression: 검증(허용 목록·클램프·진폭 선클램프 이진 탐색·각속도), 레시피 15초 상한(repeat→1 → 반복 동작 speed→1 → 중복 behavior 제거 → 최장 step 제거), 각속도 허용치 = max(120°/s, 동작의 원래 최고 속도)·클립은 120°/s, 클립은 30fps 샘플 + RDP(0.5°, ≤24키), pure.json/1 | LLM이 반복 동작 repeat 3~4로 40~270초, 라이브러리 자체가 의도된 스냅(doze 630°/s) 포함 |
| 2026-10-16 | 9 | **sim 계약 변경(승인)**: SoundEngine에 선택 `sync(t, speed)` 추가(30Hz tick마다 호출, 재생 시작 전 속도 전달), FaceSpec.keys는 tick마다 `faceAt` 보간(키가 있으면 레시피 step face 무시). lib/sound: WebAudioSynth(bright=triangle/soft=sine, A4 기준 st, length/tempo, dB, 엔벨로프) + SoundScheduler(0.25s 룩어헤드를 오디오 시계로 예약, 역방향 점프=루프 재무장, pause/seek/stop 취소), Quiet hours −12dB, 마스터 볼륨 기본 0dB(전시 스피커 확인 후 조정) | tick 지터와 무관한 큐 타이밍, 재생 속도·루프 동기화 |
| 2026-10-16 | 10① | 셸·랜딩·실험실 홈·WC 회색박스. 랜딩 문구는 data/landing.ts(PRD 기반 임시), 채널 필터는 AND·localStorage 유지, 분석 진행률은 /api/jobs?active=1 1.5s 폴링, 사용자 메뉴 Library → /lab/user-data(임시), 저장 안 된 변경 = PromptModal 취소 확인 + useUnsavedChanges(beforeunload) | 설계서 WC 문구 표 없음, 라이브러리 전용 라우트 PRD에 없음 |
| 2026-10-16 | 10② | 로봇 등록 회색박스. 분석 잡 analyze-model(PURE Desk 2s×4 연출, import 1.2s×4), import 본 읽기는 브라우저 three.js → 결과를 잡 입력으로(본 0개 = NO_RIG E2, 리그 ±90°, 타입은 본 이름·개수로 추정). repo setStructure에 replace 옵션(새 3D 파일만 리그·타입 교체), 업로드 취소 시 생성한 프로젝트 삭제 | 잡은 서버에서 재개 가능해야 하고, 파싱은 브라우저 요구(BuildPlay) |
| 2026-10-16 | 10③ | 시그니처 회색박스. 한 페이지 상태 전환(입력→읽는 중→결과/초안, E1). 톤 칩 편집·레이더 드래그는 로컬 초안 → "Save as new version"/Review/Save and return 시 새 버전(PRD 규칙 5). p.N 원문은 최신 추출 잡 result.evidence에서(버전엔 quote 미저장). "여러 소스"는 소스마다 새 버전(병합 X). 레이더·단계 표시 components/ui 공용화 | 추출 잡 입력이 단일 소스, Signature 스키마에 quote 없음 |
