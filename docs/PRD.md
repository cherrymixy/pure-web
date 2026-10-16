# PURE Web (Expert Lab) — 졸전 시뮬레이션 MVP PRD

> 로봇 타입을 고르거나 3D 파일을 올리고, 브랜드 가이드에서 **시그니처**를 뽑은 뒤, 상황 문장·레퍼런스 영상으로 **Motion / Face / Sound 3채널 표현**을 생성·조정해 시뮬레이터에서 확인하고 **pure.json으로 내보내는** 전문가용 웹.
> 졸업전시 시연용(배포 X, 실제 로봇 X). Next.js + MuJoCo 시뮬레이터(zip) + **Ollama(로컬 LLM)**. 데스크톱 1920 기준. 시연 맥(M3 Pro)에서 `localhost`로 실행.
> 태그라인: **"Pure motion, is its own signature."**

---

## 0. 작업 방식 (FITZY 하네스 그대로 + 웹용 2가지)

1. **로직 먼저 동결.** 프로젝트 / 로봇 구조 / 시그니처 / 표현(3채널) / 라이브러리 / 공유 링크 데이터와 규칙을 UI와 분리해 먼저 동결. 콘텐츠(타입 5종·추천 문장·컴포넌트 칩·상황 패턴·시드·데모 레시피·가이드라인 본문)는 `data/`로 외부화.
2. **시뮬레이터는 봉인 모듈.** zip의 `lib/lelamp` + `components/lelamp` 런타임을 `lib/sim` / `components/sim`으로 가져오고, 외부에는 `SimController` 하나(부록 B)만 노출. 브리지가 붙은 뒤 내부는 안 건드린다.
3. **디자인은 두 층.** 토큰·셸은 초반, 화면별 비주얼은 로직 동결 후. 비주얼 SSOT는 **Figma Dev Mode(MCP `get_design_context`)로 코드·변수·치수를 그대로 가져온다. 스크린샷 보고 눈대중으로 옮기지 않는다.** 스샷은 빌드 후 비교용으로만.
4. **빌드는 복붙 단계별 프롬프트.** 규칙은 `CLAUDE.md`에 영속화. 한 번에 하나 → 확인 → 다음.
5. **⭐ 모든 STEP은 localhost에서 확인 가능해야 한다.** 각 STEP 프롬프트는 "`npm run dev` → 열어볼 URL → 클릭 순서 → 보여야 하는 것"으로 끝난다. `/dev` 페이지(구현된 라우트 체크리스트·Ollama 상태·시드 리셋)가 하네스의 계기판.
6. **실험은 동결 뒤, 플래그 아래.** 영상→키프레임 직접 생성(Tier 2)은 레시피 경로가 초록이 된 다음 플래그로.
7. **UI 문구는 영어.** `data/strings.ts` 키로 관리.

---

## 1. 개요

- **한 줄 정의:** 로봇 구조 확인 → 브랜드 시그니처 → 상황·레퍼런스로 3채널 표현 생성·조정 → 시뮬 테스트 → pure.json / 공유 링크.
- **핵심 루프(에디터):** 프롬프트(Text / Image·Video) → 생성(Ollama) → 3D 뷰포트 재생 → Motion/Face/Sound 패널·타임라인 조정 → 내보내기.
- **시연 해피패스(설계서 그대로):** 랜딩 → 실험실 홈 → Try PURE's Robot → Joint Fixed → 분석 → 구조 확인 → Purebot_Brand_Guide.pdf → 시그니처 초안 v0.1 → 에디터 "I'm so tired, I keep nodding off" + dozing_cat.mp4 → 생성 → Speed 85→60, Face sleepy → 타임라인 키프레임 → Test on robot → Export pure.json → "Sleepy nod" Library 저장.

---

## 2. 범위

**포함(전부 동작)**
- W00 랜딩(스크롤형, GNB: Guideline / Sign in / Try PURE → 전부 실험실 홈으로)
- W03 가이드라인 — 로그인 전(GNB) / 로그인 후(사이드바) 두 레이아웃, 같은 콘텐츠. 개요 / Principles / Primitive tokens / Behavior / Situation / Robot classes / Templates / 다운로드. **영문만.**
- W02A 실험실 홈 — 프로젝트 그리드, 채널 필터, Import / Try PURE's Robot, 카드 메뉴(Rename / Duplicate / Replace 3D file / Delete), 분석 중 카드, 빈 실험실
- W02B 로봇 등록 — 타입 선택(5장 카드 **표시만, Joint Fixed만 선택 가능**), 3D 업로드(.GLB/.OBJ/.STL, 500MB, 드래그), 업로드 중, 분석(4단계), 완료, 리그 없음, 구조/제약 확인(관절 목록·채널·Edit limits), 지원하지 않는 파일
- W02C 브랜드 시그니처 — PDF 업로드 / 웹사이트 URL 추출(**Figma 링크는 오류 상태만**), 읽는 중, 추출 결과(컬러·서체·톤 칩·How it maps), 8축 레이더 초안(드래그 조정), Regenerate, 버전 기록(Compare / Restore), Skip 확인, 실패 안내, 저장 후 실험실 홈 토스트
- W02D 에디터 — 좌 Context(Current Status / Component / Situation Pattern / Reference) · Library 탭, 중앙 3D 뷰포트 + 재생 바 + 프롬프트(Text / Image), 우 Motion / Face / Sound 패널 + Joint Command/Actual, 생성 중 / 실패 모달 / 관절 한계 초과 모달 / 레퍼런스 분석 실패, 메뉴(☰)
- W02E 채널·타임라인 — Motion Properties, Face(프리셋·토큰·Display), Sound(큐·토큰·Output), Edit Detail 타임라인(30fps, Loop, Ease, +Keyframe, Joint Layers, 인스펙터), 레퍼런스 동기화(Side by side / Match timing), 변경 칩 + Undo
- W02F 테스트·내보내기 — 로봇 목록(더미: Purebot Desk online / Studio arm offline), 재생 카드(시뮬이 재생), 호환성 검사(실제), 내보내기 옵션, 완료, 실패, 오프라인, 공유 링크(`/s/[id]`, 만료·비밀번호·다운로드 허용), 공유 뷰어, 만료
- W04 유저 데이터 — 둘러보기(All / Popular / Recently created / User uploaded, 카테고리), 상세, Use as reference → 에디터, 검색/필터, 결과 없음
- W05 프로필 — SeungA Jeon / SeungA@purebot.com / Purebot Co. / Google, 팀 4명(역할 변경·초대는 UI 동작 + 로컬 저장), Edit profile, 사용자 메뉴(Library / Profile & team / Log out → 확인 후 랜딩)
- WC 공통 — 빈 화면, 토스트, 확인 모달, 저장 안 된 변경 경고, 로딩, 404, 보기 전용, 모바일 접속 안내
- `/dev` 계기판(전시 제외)

**제외**
- W01 로그인/회원가입/비밀번호/인증(앱은 항상 SeungA로 로그인된 상태), 실제 로봇 통신·펌웨어, 이메일 발송, Figma 링크 추출, 다른 타입 4종의 시뮬 모델, 가져온 3D 모델의 본 구동(부록 D 🟡), 다크 테마, 한국어 UI, 서버 배포

---

## 3. 유저 플로우 (해피패스, 영어 UI)

```
[W00 Landing] ─ Open Lab / Sign in / Try PURE ─▶ [W02A Lab home: project grid]
   │ Try PURE's Robot
   ▼
[W02B-1 Select type] Joint Fixed → Continue with Joint Fixed
   ▼ (PURE Desk 모델 로드)
[W02B-3 Analyzing] Reading the mesh → Finding joints(5) → Checking joint limits → Detecting channels → Complete!
   ▼
[W02B-4 Structure] Joints 5 (base_yaw / shoulder_pitch / elbow_pitch / head_pan / head_tilt) · Channels Motion/Face/Sound · Edit limits → Confirm structure
   ▼
[W02C-1 Brand guide] Purebot_Brand_Guide.pdf drop → Extract → Reading colors → type → tone
   ▼
[W02C-2 Extracted] palette · Purebot Sans · warm/precise/playful · How it maps(p.12…) → [W02C-3 Signature draft] 8-axis radar v0.1 → Review the draft
   ▼
[W02D Editor] Context: "I'm nodding off because I'm tired." · Reference dozing_cat.mp4 · Prompt "I'm so tired, I keep nodding off" → Generate
   → Generating motion, face and sound… (5~15s) → 3D viewport plays · Motion 71/53/…/85/60 · Joint Command/Actual
   → Speed 85→60 (Undo chip) · Face preset sleepy · Edit Detail timeline keyframe 00:01.25
   ▼
☰ Test on robot → Purebot Desk ● online → Connect → "Playing on Purebot Desk" card (sim plays) · within limits OK
☰ Export → Robot / pure.json / Share link → Ready to export → Exported · Download pure.json · Copy link
   ▼
Library: "Sleepy nod · Motion · Face · Sound" · User Data에도 노출
```

---

## 4. 라우트 / 화면 정의

| 라우트 | 화면 ID | 핵심 동작 |
|---|---|---|
| `/` | W00-1 | 스크롤 랜딩. GNB Guideline / Sign in / Try PURE. 섹션 Why PURE / For Expert / Robot types / Guideline. 모든 CTA → `/lab` |
| `/guideline/[...slug]` | W03 (GNB) | 공개 버전. 좌측 목차, 본문, 코드/토큰 표, Do/Don't |
| `/lab/guideline/[...slug]` | W03 (사이드바) | 같은 콘텐츠, Lab 사이드바 레이아웃 |
| `/lab` | W02A-1~3 | 프로젝트 그리드(최근 수정순 3열, 타입 태그, 채널 아이콘, 분석 중 진행률), 채널 필터(복수, 유지), Import / Try PURE's Robot, 카드 ⋮ 메뉴, 빈 실험실 |
| `/lab/new/type` | W02B-1 | 타입 카드 5장. **Joint Fixed만 선택·Continue 가능**, 나머지는 hover만 |
| `/lab/new/import` | W02B-2 | 드롭존(.GLB/.OBJ/.STL ≤500MB), 형식 카드, 업로드 중(진행률·Cancel), 지원하지 않는 파일(E1) |
| `/lab/p/[id]/analyzing` | W02B-3 | 모델 미리보기 + 스캔 라인, 4단계 체크, 퍼센트/남은 시간, Complete! → 자동 전환, No rig found(E2). 나가도 계속 |
| `/lab/p/[id]/structure` | W02B-4 | 3D 뷰포트(관절 번호, 클릭 강조), 관절 목록·범위, 채널 토글, Edit limits(좁히기만), Confirm structure → signature. 하단 단계 표시 |
| `/lab/p/[id]/signature` | W02C-1~3 | 소스 입력(PDF 드롭 / URL / Figma→오류), 읽는 중, 추출 결과(Extracted · Tone 칩 편집 · How it maps p.N), 8축 레이더 초안(드래그 → 미리보기 즉시 반영), Regenerate, v0.N ▾ 버전 기록(Compare / Restore), Review the draft → 에디터, Save and return to Lab, Skip 확인, 실패(E1) |
| `/lab/p/[id]` | W02D·W02E | **단일 에디터.** 좌 Context/Library, 중앙 뷰포트+재생 바+프롬프트(Text/Image), 우 Motion/Face/Sound 탭 + Joint, 하단 Edit Detail 타임라인(토글), 변경 칩+Undo(Cmd+Z), ☰ 메뉴(Lab home / Rename / Change signature / Test on robot / Export / Delete) |
| (모달) | W02F-1~4, E1, E2 | Test on your robot(목록·Connect·재생 카드·Stop), Export(목적지·옵션·호환성 검사·Ready/1 issue), Exported, Can't reach, Share link(링크·만료·비밀번호·다운로드 허용) |
| `/s/[shareId]` | W02F-5 | 공유 뷰어(로그인 X): 팀·표현 수·시그니처 버전·타입·남은 기간, 플레이어(시뮬, 회전만), 표현 목록, Download pure.json(허용 시), 비밀번호 화면, 만료 화면 |
| `/lab/user-data` | W04-1~3 | 모션 둘러보기(탭·카테고리·검색), 카드(사용 수·미리보기), 상세(플레이어·Use as reference → `/lab?ref=`→ 프로젝트 선택 → 에디터 Context에 첨부), 결과 없음 |
| `/lab/profile` | W05 | 프로필·팀·계정. Edit profile(이름 1~20자, 회사; 이메일 불가), Invite(칩 입력·역할 → Pending 7일), 역할 메뉴(Owner), Log out 확인 → `/` |
| `/dev` | — | 라우트 체크리스트(구현됨/미구현), Ollama 상태(모델 목록·ping·마지막 응답 시간), Reset demo data, DB 보기, 데모 모드 토글 |

사이드바(로그인 후): User(이름·메일 → 사용자 메뉴) / Lab / Guideline / User Data. 로그인 전 GNB: 로고 / Guideline / Sign in / Try PURE.

---

## 5. 콘텐츠 (`data/`)

- **타입 5종:** Full-body(23–43 DoF) / Joint Walking(10–14) / Joint Driving(2–6 + wheels) / Jointless Driving(0 · wheels) / **Joint Fixed(5–9, PURE Desk)**. 각 설명·채널 기본값.
- **PURE Desk 구조(시드):** base_yaw / shoulder_pitch / elbow_pitch / head_pan / head_tilt + 범위(`robot.xml`), 채널 Motion·Face·Sound.
- **추천 문장:** Hey, I'm here! / The presentation went well today! / I'm so tired… / Wow, that startled me!
- **Component 칩:** zip 동작 15종(idle doze sleep wake nod shake look_around curious happy sad alert greet sweep focus home) + 가이드라인 Behavior 이름 매핑. **Situation Pattern:** Face to Face / Touching / Side by side / Passing by / Calling / At a distance / Alone(7).
- **Face 프리셋:** soft / wide / blink / sleepy / happy (+ neutral). **Sound 큐:** low warm cue / soft breath / rising chirp / falling tone (+ signature tone).
- **8축 시그니처:** tempo / amp / settle / antic / rhythm / eyes / pitch / density (0~100). PURE Default = 전부 50.
- **톤 키워드 사전:** warm·precise·playful·calm·confident·bold·gentle·energetic… → 축 가중치 + "How it maps" 문장 템플릿.
- **시드:** 프로필·팀 4명, 프로젝트 5개(Test-01·Sleepy robot·Surprising·Test- final·Pure bot - dog), 라이브러리 4개(Sleepy nod·Hello wave·Curious tilt·Startled hop), 유저 데이터 모션(동작 15종 + 가짜 사용 수·카테고리 Idle/Approach/Interaction/Task/Expressive/Other), 로봇 2대(Purebot Desk online / Studio arm offline).
- **데모 레시피:** 추천 문장 4개 + 컴포넌트 칩별 레시피 + softer 변형.
- **가이드라인 본문:** zip `guideline-content.ts`·`PURE_Knowledge`를 새 구조(Principles 5 / Primitive tokens 18축 / Behavior 16 / Situation 7 / Robot classes 5 / Templates)로 재배치, 빈 곳은 placeholder 표시(🟡).
- **문구:** 설계서 WC 문구 표 키.

---

## 6. 핵심 규칙 (*동결 대상*)

1. **프로젝트:** Try PURE → `robotSource=pure-desk`, Import → 업로드 파일. 분석은 서버 잡(진행률 폴링), 나가도 계속. 완료 → `structure` 저장. Draft 상태로 홈 카드에 남음.
2. **Import 분석(실제):** 브라우저 three.js로 메시·본(skeleton) 읽기 → 관절 수·이름·추정 타입. 범위는 기본값(±90°). 본이 없으면 No rig found. **에디터 재생은 PURE Desk가 대신**(🟡).
3. **구조:** Edit limits는 리그 범위보다 좁게만. 채널은 타입 기본값에서 토글.
4. **시그니처 추출:** PDF → 텍스트(pdf-parse) + 폰트명 + 색(가능한 만큼) → Ollama가 톤 키워드 3~5개 + 근거 페이지 → 사전으로 8축 산출 + "How it maps". URL → HTML에서 색·폰트·본문 → 같은 경로. Figma URL → E1 오류. 실패(텍스트 없음) → E1. Skip → PURE Default.
5. **시그니처 버전:** 확정·Regenerate·값 편집 저장마다 v0.N. Restore는 새 버전으로. 표현은 생성 당시 시그니처 스냅샷을 가진다.
6. **생성(Ollama):** 입력 = 프롬프트 + Context(Current Status / Component / Situation Pattern / Reference 프레임 8장) + 구조 + 시그니처. 출력 = `Expression {motion: Recipe, face: {preset, tokens}, sound: {cues[], tokens}, currentStatus, reasoning}` (JSON schema `format`). **Tier 1 레시피 기본, Tier 2 클립 플래그.** 검증(허용 목록·범위 클램프·관절 범위·각속도 ≤120°/s). 평균 5~15초, 60초 실패. Stop → 이전 결과 유지. 실패·Ollama 없음 → 데모 레시피.
7. **시그니처 → 재생 파라미터:** speed=lerp(0.7,1.4,tempo) · amplitude=lerp(0.6,1.3,amp) · settle→easing(낮음 overshoot / 높음 out-soft) · antic→anticipation 프리무브 비율 · rhythm→repeat/frequency · eyes→기본 Eye size · pitch→Sound pitch 기준 · density→큐 개수. **Motion Properties(Amplitude/Duration/Smoothness/Speed/Frequency 0~100)** 는 표현별 오버라이드, 시그니처 범위 밖이면 경고.
8. **관절 한계:** 재생 중 명령값이 구조 범위를 넘으면 즉시 정지 + 모달(어느 관절, 얼마나). Auto-adjust = 클램프 후 재생성 없이 재샘플, Edit on timeline = 타임라인 열기.
9. **타임라인:** zip `clip.ts`(키프레임·easing) 그대로. 30fps 표시, Loop, +Keyframe(재생 헤드), 인스펙터(시간/값/Ease, 범위 밖 입력 불가), Cmd+Z 히스토리. Face/Sound 클립도 같은 타임라인 트랙. Match timing = 레퍼런스 프레임 간 움직임량 피크에 키프레임 시간 정렬(되돌리기 가능).
10. **Face(절차적):** 캔버스에 눈 2 + 눈썹 2(+입 선택)를 Eye size / Eye angle / Brow angle / Brightness / Blink rate로 그려 `CanvasTexture`로 화면에. 프리셋 = 토큰 묶음. mp4 7종은 "Video" 프리셋 폴백.
11. **Sound(Web Audio):** 큐 = {waveform(bright=triangle/soft=sine), pitch st, tempo ×, length s, volume dB} 합성. 타임라인 위치에 재생. 미리듣기 ▶.
12. **호환성 검사(실제):** 대상 로봇 구조 기준 관절 범위 / 각속도 120°/s / 채널 보유. 실패 → 1 issue found + Fix in editor / Include fallback(채널 없는 로봇용 대체 동작 = Motion만).
13. **내보내기:** pure.json = {meta, robot structure, signature(v), expression(motion clip + face + sound), options} 다운로드(실제). Export to robot = 성공 화면(더미). 내보낸 표현은 Library에 저장.
14. **공유 링크:** `/s/[id]` 로컬 DB. 만료(기본 7일, 실제 계산), 비밀번호(5회 실패 5분 제한), 다운로드 허용. 로그인 없이 열림.
15. **라이브러리:** 계정 소속(모든 프로젝트에서 보임). Apply to this robot → 구조 다르면 리타깃(PURE Desk ↔ 가져온 모델은 채널 매핑만).
16. **테스트:** 서비스는 인터페이스 뒤(`GenerationClient`: Ollama / Demo / Fake). 시계 주입. 통합테스트는 Fake로.

---

## 7. 데이터 모델 (TypeScript, `lib/models.ts`)

```ts
type RobotType = 'full-body'|'joint-walking'|'joint-driving'|'jointless-driving'|'joint-fixed';
type Channel = 'motion'|'face'|'sound';
interface Joint { id: string; label: string; min: number; max: number; rigMin: number; rigMax: number; }
interface Structure { type: RobotType; joints: Joint[]; channels: Channel[]; source: 'pure-desk'|'import'; file?: {name; size; path}; }
interface Signature { id; name; version: number; axes: Record<'tempo'|'amp'|'settle'|'antic'|'rhythm'|'eyes'|'pitch'|'density', number>; tone: string[]; mapping: {axis; value; reason; page?}[]; sources: Source[]; note: string; createdAt; }
interface Project { id; name; type: RobotType; status: 'analyzing'|'draft'|'ready'; progress?; structure?: Structure; signatureId?; signatureHistory: Signature[]; channelsUsed: Channel[]; updatedAt; }
interface Recipe { steps: {behavior; speed; amplitude; repeat; face?}[]; loop?: boolean }
interface Clip { format: 'lelamp.clip/1'; duration; tracks: Record<JointId, Key[]> }
interface FaceSpec { preset: string; tokens: {eyeSize; eyeAngle; browAngle; brightness; blinkRate}; keys?: {t; tokens}[] }
interface SoundSpec { cues: {id; t; pitchSt; tempo; lengthS; timbre: 'bright'|'soft'; volumeDb}[] }
interface Expression { id; projectId; name; currentStatus; components: string[]; pattern: string; references: Reference[]; motion: {mode: 'recipe'|'clip'; recipe: Recipe; clip?: Clip; props: {amplitude; duration; smoothness; speed; frequency}}; face: FaceSpec; sound: SoundSpec; signatureSnapshot: Signature; version; history: Expression[]; createdAt; }
interface Reference { id; kind: 'video'|'image'|'userData'; path; thumb; durationS?; frames?: string[]; status: 'ok'|'failed' }
interface SavedExpression extends Expression { savedAt; channels: Channel[] }           // Library
interface Share { id; expressionIds[]; signatureVersion; type; expiresAt; password?; allowDownload; attempts }
interface UserDataMotion { id; name; category; uses; preview: Recipe; source: 'seed'|'user'; }
interface Profile { name; email; company; signedInWith; team: {name; email; role; pending?; expiresAt?}[] }
```

- 저장: `data/db.json`(lowdb) + `data/uploads/`(3D·PDF·영상·프레임·썸네일). 모든 접근은 `lib/repo.ts` 인터페이스.

---

## 8. 시뮬레이터 모듈

- 가져오기: `_ref/pure-web/lib/lelamp/{motion,clip,behaviors,robots,state-motion}.ts` → `lib/sim/`, `components/lelamp/{viewer3d,mujoco,lamp,LeLampProvider}` 런타임 → `components/sim/`, `public/mujoco/`, `public/pure-desk/`. `TimelineEditor.tsx`는 W02E의 기반으로 가져와 개조. LeLamp 모델·에셋 제외.
- 추가: 얼굴 텍스처를 `VideoTexture` → `CanvasTexture`로 교체 가능하게(프리셋 Video는 기존 경로), 관절 Command/Actual 노출, 범위 초과 감지 이벤트, `capture()`.
- 계약: 부록 B `SimController`. 뷰포트는 에디터·구조 확인·시그니처·공유 뷰어·유저 데이터 카드가 공유(**페이지당 인스턴스 1개**, 카드 미리보기는 캡처 PNG 또는 가벼운 kinematic 프리뷰).

---

## 9. Ollama

- `http://localhost:11434`, 네이티브 `/api/chat` + `format: <JSON schema>` + `images: [base64]`.
- 모델: 텍스트+비전 하나로 **`gemma3:12b`** 추천(M3 Pro 18GB면 `gemma3:4b`로 낮춤). `OLLAMA_MODEL` / `OLLAMA_VISION_MODEL` env. STEP 0에서 `ollama list`로 확인하고 없으면 `ollama pull`.
- 프롬프트는 zip `app/api/analyze/route.ts` 골격 계승. 로컬 모델이라 JSON이 깨질 수 있음 → 스키마 강제 + 재시도 1회 + 검증 실패 시 데모 폴백.
- 시그니처 추출·생성·Match timing 전부 서버 라우트(`app/api/…`)에서 호출. 키 없음.

---

## 10. 디자인 방향

- 토큰 SSOT: Design System 페이지(`70:1520`) F/Color·Typography·Spacing & Radius·Effect·Icon. 컴포넌트: C/ 섹션.
- 화면 SSOT(하이파이): [웹] 화면설계서 페이지의 **WEB MVP 클릭 프로토타입 프레임 21장**(`901:6909` 랜딩 … `901:13980` Exported). 설계서 와이어는 동작 명세용.
- **Dev Mode 그대로:** `get_design_context`가 주는 코드·변수·치수·오토레이아웃을 토큰 기반 컴포넌트로 옮긴다. 스샷 보고 추정 금지.
- 밝은 문서 UI(seed-design 구조), 회색 미리보기 패널, Do/Don't 초록·빨강 바. 다크 X.

---

## 11. 마일스톤

```
로직: 1 스캐폴드+/dev → 2 sim 모듈 이식 → 3 SimController+뷰포트 → 4 모델·콘텐츠·시드 → 5 DB(lowdb)·repo·API
     → 6 Ollama 클라이언트+데모 폴백 → 7 시그니처 엔진(추출·8축·매핑) → 8 표현 엔진(검증·파라미터·호환성·pure.json)
     → 9 Face(캔버스)·Sound(Web Audio) → 10 회색박스 7슬라이스 → 11 통합테스트(v0.1-logic)
실험: 12 영상→키프레임(플래그 directClip) · Match timing 고도화
디자인(Figma Dev Mode→코드): 20 토큰 → 21 폰트·아이콘 → 22 컴포넌트·화면 번역 → 23 폴리시 → 24 연출 → 25 마감·시연(v0.2)
```

---

## 부록 D — 열린 결정

| 항목 | 값 | 상태 |
|---|---|---|
| 레포 | 새 Next.js 레포. zip은 `_ref/`로 두고 sim·가이드라인 콘텐츠만 이식 | ✅ |
| LLM | Ollama 로컬(M3 Pro). gemma3:12b 추천, 메모리 따라 4b | ✅ (모델은 STEP 0) |
| 로그인 | 없음. 항상 SeungA로 로그인 상태, 랜딩 CTA → `/lab` | ✅ |
| 타입 카드 | 5장 표시, Joint Fixed만 동작 | ✅ |
| Figma 링크 추출 | 미구현(오류 상태) | ✅ |
| Face / Sound | 절차적 캔버스 얼굴 + Web Audio 합성 | ✅ |
| 가이드라인 | 영문만. zip 콘텐츠를 새 구조로 재배치, 빈 곳 placeholder | ✅ / 본문 보강 🟡 |
| 유저 데이터 | 시드 + Use as reference 실제 | ✅ |
| 저장 | 서버 JSON(lowdb) + uploads/ | ✅ |
| 확인 방식 | STEP마다 localhost URL·클릭 순서, `/dev` 계기판 | ✅ |
| 비주얼 | Figma Dev Mode(MCP) 그대로, 캡처 추정 금지. 하이파이 = 클릭 프로토타입 21장 | ✅ |
| Import 모델 | 분석(메시·본)까지 실제, 에디터 재생은 PURE Desk 대신 | 🟡 추천 |
| 다른 로봇 Apply(리타깃) | 채널 매핑만(구조 동일 가정) | 🟡 추천 |
| Tier 2 클립 생성 | 플래그, 기본 off | 🟡 |
| 공유 링크 비밀번호 | 실제 구현(간단) | 🟡 추천 |
| 시연 브라우저 | Chrome, 1920×1080, 전체화면 | 🟡 |

---

## 한 줄 요약
**타입/3D → 구조 → 브랜드 가이드 → 8축 시그니처 → 프롬프트·레퍼런스 → Ollama가 3채널 표현 → MuJoCo 시뮬 재생·타임라인 조정 → pure.json/공유 링크. 로직 먼저 동결, 시뮬은 봉인, 비주얼은 Figma Dev Mode 그대로, 모든 단계는 localhost에서 눈으로 확인.**
