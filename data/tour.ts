// Guided tour ("안내에 따라 체험하기"): one coach mark per step, in the real demo order.
// target = CSS selector on the page (data-tour marks, or existing test ids). advance:
//   click  → clicking inside the target (or submitting it, for a form) moves on
//   next   → "다음" button in the bubble
//   route  → nothing to press; the next page load moves on
//   done   → last step, "끝내기" button
// waiting = shown while the target isn't on screen yet (e.g. a result still loading).

export type TourStep = {
  path: RegExp;
  target?: string;
  advance: "click" | "next" | "route" | "done";
  title: string;
  body: string;
  waiting?: string;
};

export const TOUR_LABELS = {
  next: "다음",
  done: "끝내기",
  skip: "투어 종료",
  count: "{n} / {total}",
};

export const TOUR_STEPS: TourStep[] = [
  {
    path: /^\/lab$/,
    target: '[data-tour="try-robot"]',
    advance: "click",
    title: "PURE 로봇으로 시작해요",
    body: "PURE가 준비한 로봇으로 표현을 직접 만들어 볼게요. 버튼을 눌러 주세요.",
  },
  {
    path: /^\/lab\/new\/type$/,
    target: '[data-testid^="type-card-"]:not(:disabled)',
    advance: "click",
    title: "로봇 형태 고르기",
    body: "로봇은 관절과 이동 방식에 따라 다섯 가지 형태로 나뉘어요. 시연에서는 Joint Fixed 로봇을 체험할 수 있어요. 카드를 눌러 선택해 주세요.",
  },
  {
    path: /^\/lab\/new\/type$/,
    target: '[data-tour="type-continue"]',
    advance: "click",
    title: "선택한 로봇으로 계속",
    body: "Continue를 눌러 다음 단계로 넘어가요.",
  },
  {
    path: /^\/lab\/p\/[^/]+\/analyzing$/,
    target: '[data-tour="analyzing"]',
    advance: "route",
    title: "로봇 구조 분석",
    body: "PURE가 로봇의 관절과 움직일 수 있는 범위를 읽고 있어요. 끝나면 자동으로 넘어가요.",
  },
  {
    // No target: nothing is dimmed or blocked, so the 3D stage and the panel can be explored freely.
    path: /^\/lab\/p\/[^/]+\/structure$/,
    advance: "next",
    title: "구조 둘러보기",
    body: "분석된 관절 구조를 3D로 살펴보세요. 화면을 드래그해 로봇을 돌려 보고, 번호를 눌러 관절을 하나씩 확인할 수 있어요. 다 둘러봤다면 다음을 눌러 주세요.",
  },
  {
    path: /^\/lab\/p\/[^/]+\/structure$/,
    target: '[data-tour="structure-confirm"]',
    advance: "click",
    title: "구조 확인",
    body: "구조가 맞다면 버튼을 눌러 다음 단계로 넘어가요.",
  },
  {
    path: /^\/lab\/p\/[^/]+\/signature$/,
    target: '[data-tour="sig-sample"]',
    advance: "click",
    title: "브랜드 가이드 불러오기",
    body: "로봇의 성격은 브랜드에서 시작해요. 샘플 브랜드 가이드 PDF를 사용해 볼게요.",
  },
  {
    path: /^\/lab\/p\/[^/]+\/signature$/,
    target: '[data-tour="sig-radar"]',
    advance: "next",
    title: "8축 시그니처",
    body: "브랜드 가이드에서 읽어낸 성격을 8개 축으로 표현했어요. 꼭짓점을 끌어서 직접 조정할 수도 있어요.",
    waiting: "브랜드 가이드를 읽고 있어요. 잠시만 기다려 주세요.",
  },
  {
    path: /^\/lab\/p\/[^/]+\/signature$/,
    target: '[data-tour="sig-review"]',
    advance: "click",
    title: "시그니처 저장",
    body: "이 시그니처를 저장하고 표현 에디터로 이동해요.",
  },
  {
    path: /^\/lab\/p\/[^/]+$/,
    target: '[data-tour="composer"]',
    advance: "click",
    title: "문장으로 표현 만들기",
    body: "로봇이 어떤 상황에서 어떻게 반응하면 좋을지 적고 Send를 눌러 주세요. 예: 사용자가 돌아오면 반갑게 인사해 줘",
  },
  {
    path: /^\/lab\/p\/[^/]+$/,
    target: '[data-tour="edit-detail"]',
    advance: "click",
    title: "타임라인으로 다듬기",
    body: "생성된 Motion·Face·Sound를 타임라인에서 시간 단위로 조정할 수 있어요. Edit Detail을 눌러 열어 보세요.",
  },
  {
    path: /^\/lab\/p\/[^/]+$/,
    target: '[data-tour="project-menu"]',
    advance: "click",
    title: "테스트와 내보내기",
    body: "메뉴의 Test로 로봇에서 미리 재생하고, Export로 pure.json과 공유 링크를 만들 수 있어요. 메뉴를 열어 보세요.",
  },
  {
    path: /^\/lab/,
    advance: "done",
    title: "체험 완료",
    body: "PURE의 행동 설계 과정을 모두 둘러봤어요. 이제 자유롭게 둘러보며 더 많은 표현을 만들어 보세요.",
  },
];
